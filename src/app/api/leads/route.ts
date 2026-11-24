import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { submitLeadSchema } from "@/features/leads/schemas";
import { normalizeWorkspaceFeatures } from "@/features/workspace/types";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 phút
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function hashIp(ip: string): string {
  const salt = process.env.LEADS_IP_SALT || "gocafe-leads-v1";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function isSafePublicWebhookUrl(raw?: string): boolean {
  const s = (raw || "").trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host === "[::1]" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function notifyTenantLeadChannels(
  payload: {
    workspaceId: string;
    formName: string;
    fullName: string;
    phone: string;
    email?: string;
    note?: string;
    pageSlug: string;
    utmSource?: string;
  },
  tenantConfig?: {
    telegramBotToken?: string;
    telegramChatId?: string;
    webhookUrl?: string;
  }
) {
  const token = tenantConfig?.telegramBotToken?.trim() || process.env.LEADS_TELEGRAM_BOT_TOKEN;
  const chatId = tenantConfig?.telegramChatId?.trim() || process.env.LEADS_TELEGRAM_CHAT_ID;

  if (token && chatId) {
    const lines = [
      `[Lead mới] ${payload.formName}`,
      `Họ tên: ${payload.fullName}`,
      `SĐT: ${payload.phone}`,
      payload.email ? `Email: ${payload.email}` : null,
      payload.note ? `Ghi chú: ${payload.note}` : null,
      `Trang: /${payload.pageSlug}`,
      payload.utmSource ? `Nguồn UTM: ${payload.utmSource}` : null,
    ].filter(Boolean);

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join("\n"),
        }),
      });
    } catch (err) {
      console.error("Không gửi được thông báo Telegram:", err);
    }
  }

  const webhookUrl = tenantConfig?.webhookUrl?.trim();
  if (webhookUrl && isSafePublicWebhookUrl(webhookUrl)) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lead.created",
          timestamp: new Date().toISOString(),
          ...payload,
        }),
      });
    } catch (err) {
      console.error("Không gửi được Webhook Lead:", err);
    }
  }
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Dữ liệu gửi lên không hợp lệ" },
      { status: 400 }
    );
  }

  const parsed = submitLeadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Thông tin đăng ký chưa hợp lệ",
      },
      { status: 400 }
    );
  }

  // Tầng chống spam 1: Honeypot (nếu bot điền trường ẩn `website`, trả 200 giả và không lưu DB)
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const admin = createSupabaseAdminClient();
  const normalizedSlug = parsed.data.pageSlug.toLowerCase();

  // Xác định chính xác workspace_id & page_id từ slug trang đã published (chống giả mạo workspace)
  const { data: slugRow, error: slugErr } = await admin
    .from("page_slugs")
    .select(
      "page_id, pages!inner(id, workspace_id, status, archived_at, workspaces!inner(archived_at, features))"
    )
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (slugErr || !slugRow) {
    return NextResponse.json(
      { success: false, error: "Không tìm thấy trang đăng ký hợp lệ" },
      { status: 404 }
    );
  }

  const pageMeta = slugRow.pages as unknown as {
    id: string;
    workspace_id: string;
    status: string;
    archived_at: string | null;
    workspaces?: { archived_at: string | null; features: unknown } | null;
  };

  const wsFeatures = normalizeWorkspaceFeatures(pageMeta.workspaces?.features);
  if (
    pageMeta.status !== "published" ||
    pageMeta.archived_at !== null ||
    pageMeta.workspaces?.archived_at !== null ||
    !wsFeatures.leads
  ) {
    return NextResponse.json(
      { success: false, error: "Trang này hiện không nhận đăng ký" },
      { status: 403 }
    );
  }

  // Tầng chống spam 2: Rate limit theo ip_hash SHA-256 (tối đa 5 lần / 10 phút / IP)
  const ipHash = hashIp(getClientIp(req));
  const sinceIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count: recentCount } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", pageMeta.workspace_id)
    .eq("ip_hash", ipHash)
    .gte("created_at", sinceIso);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      {
        success: false,
        error: "Bạn vừa gửi nhiều yêu cầu liên tiếp. Vui lòng thử lại sau ít phút.",
      },
      { status: 429 }
    );
  }

  const { error: insertErr } = await admin.from("leads").insert({
    workspace_id: pageMeta.workspace_id,
    page_id: pageMeta.id,
    form_name: parsed.data.formName,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    note: parsed.data.note || null,
    status: "new",
    utm_source: parsed.data.utmSource || null,
    utm_medium: parsed.data.utmMedium || null,
    utm_campaign: parsed.data.utmCampaign || null,
    ip_hash: ipHash,
  });

  if (insertErr) {
    console.error("Lỗi lưu lead:", insertErr);
    return NextResponse.json(
      { success: false, error: "Không thể gửi thông tin lúc này, vui lòng thử lại sau." },
      { status: 500 }
    );
  }

  // Đọc cấu hình Telegram/Webhook riêng của Workspace (từ bộ Site Shell mặc định)
  const { data: defaultShell } = await admin
    .from("site_shells")
    .select("header_config")
    .eq("workspace_id", pageMeta.workspace_id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const leadNotifications = (
    (defaultShell?.header_config || {}) as {
      leadNotifications?: {
        telegramBotToken?: string;
        telegramChatId?: string;
        webhookUrl?: string;
      };
    }
  ).leadNotifications;

  // Gửi thông báo Telegram / Webhook riêng của Tenant nếu có cấu hình (không chặn response)
  void notifyTenantLeadChannels(
    {
      workspaceId: pageMeta.workspace_id,
      formName: parsed.data.formName,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      note: parsed.data.note || undefined,
      pageSlug: normalizedSlug,
      utmSource: parsed.data.utmSource || undefined,
    },
    leadNotifications
  );

  return NextResponse.json({ success: true });
}
