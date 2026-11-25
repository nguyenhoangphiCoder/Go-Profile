import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env.client";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import type { Database } from "@/types/database.generated";
import type { PublicPageDTO, ResolveLinkResult, RecordClickResult } from "./types";

/** Tag cache cho toàn bộ trang công khai — xoá ngay khi xuất bản / ẩn / đổi slug / lưu trữ. */
export const PUBLIC_PAGES_TAG = "public-pages";

let publicAnonClient: ReturnType<typeof createClient<Database>> | null = null;

export function getPublicAnonClient() {
  if (!publicAnonClient) {
    publicAnonClient = createClient<Database>(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return publicAnonClient;
}

/**
 * Tải dữ liệu trang công khai theo slug với Next.js Cache Components (`"use cache"`).
 * - Được cache ở server theo tag `public-pages` (và tự làm mới sau vài phút).
 * - Khi Admin bấm Xuất bản / Ẩn trang / Đổi slug / Lưu trữ -> gọi revalidateTag(PUBLIC_PAGES_TAG, "max").
 */
export async function fetchPublicPage(slug: string): Promise<PublicPageDTO> {
  "use cache";
  const normalized = slug.trim().toLowerCase();
  cacheLife("minutes");
  cacheTag(PUBLIC_PAGES_TAG, `public-page:${normalized}`);

  const supabase = getPublicAnonClient();

  const { data, error } = await supabase.rpc("get_public_page", {
    p_slug: normalized,
  });

  if (error || !data) {
    if (error) {
      console.error(
        `Lỗi khi tải trang công khai slug="${slug}":`,
        error.message || error.code || JSON.stringify(error)
      );
    }
    return { found: false, reason: "SLUG_NOT_FOUND" };
  }

  const dto = data as unknown as PublicPageDTO;
  // Bảo mật: không bao giờ gửi token Telegram / Webhook riêng của Tenant ra HTML công khai
  if (
    dto?.site_shell?.settings?.header_config &&
    "leadNotifications" in dto.site_shell.settings.header_config
  ) {
    const safeHeader = { ...dto.site_shell.settings.header_config };
    delete safeHeader.leadNotifications;
    dto.site_shell.settings.header_config = safeHeader;
  }
  return dto;
}

export async function resolveAndRecordClick(
  pageLinkId: string,
  skipTracking: boolean = false
): Promise<{ valid: boolean; targetUrl?: string; kind?: string; reason?: string }> {
  // Dùng privileged client vì resolve_public_link và record_click yêu cầu quyền service_role
  const privileged = createSupabaseAdminClient();

  // 1. Phân giải liên kết
  const { data: resolveData, error: resolveErr } = await privileged.rpc("resolve_public_link", {
    p_page_link_id: pageLinkId,
  });

  if (resolveErr || !resolveData) {
    console.error(`Lỗi RPC resolve_public_link (id=${pageLinkId}):`, resolveErr);
    return { valid: false, reason: "RESOLVE_FAILED" };
  }

  const resolve = resolveData as unknown as ResolveLinkResult;

  if (!resolve.valid || !resolve.target_url) {
    return { valid: false, reason: resolve.reason || "LINK_NOT_FOUND_OR_INACTIVE" };
  }

  // 2. Ghi nhận sự kiện click nếu không thuộc diện bỏ qua (bot, preview, HEAD)
  if (!skipTracking && resolve.revision_id) {
    const eventId = crypto.randomUUID();

    try {
      const { data: clickData, error: clickErr } = await privileged.rpc("record_click", {
        p_event_id: eventId,
        p_page_link_id: pageLinkId,
        p_expected_revision_id: resolve.revision_id,
      });

      if (clickErr) {
        // P07.06: Khi resolve đã thành công nhưng ghi click lỗi, vẫn mở đích và log lỗi
        console.error(`Lỗi ghi nhận click_events (id=${pageLinkId}):`, clickErr);
      } else {
        const clickRes = clickData as unknown as RecordClickResult;
        if (!clickRes.success) {
          console.warn(`Click event rejected (id=${pageLinkId}):`, clickRes.error);
        }
      }
    } catch (err) {
      // Bắt mọi ngoại lệ để đảm bảo trải nghiệm mở link của người dùng không bao giờ bị chặn
      console.error(`Exception khi ghi nhận click (id=${pageLinkId}):`, err);
    }
  }

  return {
    valid: true,
    targetUrl: resolve.target_url,
    kind: resolve.kind,
  };
}
