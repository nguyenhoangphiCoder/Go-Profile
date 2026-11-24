import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import type { Json } from "@/types/database.generated";

export interface PlatformAuditLogItem {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function logPlatformAudit(params: {
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = createSupabaseAdminClient();
    const { error } = await db.from("platform_audit_logs").insert({
      actor_user_id: params.actorUserId,
      actor_email: params.actorEmail,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId ?? null,
      metadata: (params.metadata ?? {}) as Json,
    });
    if (error) {
      console.error("[audit] Không ghi được platform_audit_logs:", error);
    }
  } catch (err) {
    console.error("[audit] Lỗi ngoại lệ khi ghi platform_audit_logs:", err);
  }
}

export async function getPlatformAuditLogs(limit = 100): Promise<PlatformAuditLogItem[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("platform_audit_logs")
    .select("id, actor_user_id, actor_email, action, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  }));
}
