import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import type { PublicPageDTO, ResolveLinkResult, RecordClickResult } from "./types";

export async function fetchPublicPage(slug: string): Promise<PublicPageDTO> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_page", {
    p_slug: slug.trim().toLowerCase(),
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

  return data as unknown as PublicPageDTO;
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

