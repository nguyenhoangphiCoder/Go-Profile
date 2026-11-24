import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import {
  normalizeWorkspaceFeatures,
  type WorkspaceFeatures,
  type WorkspacePlan,
  type WorkspaceRole,
} from "./types";

export interface MemberItem {
  userId: string;
  email: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface InvitationItem {
  id: string;
  email: string;
  role: WorkspaceRole;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface WorkspaceOverview {
  id: string;
  name: string;
  plan: WorkspacePlan;
  features: WorkspaceFeatures;
  maxPages: number;
  maxMediaBytes: number;
  maxBranches: number;
  maxShells: number;
  archivedAt: string | null;
  memberCount: number;
  ownerEmails: string[];
  pageCount: number;
  branchCount: number;
  leadCount: number;
  shellCount: number;
  mediaBytes: number;
  pendingInvitations: number;
}

type AdminDb = ReturnType<typeof createSupabaseAdminClient>;

/** Email của người dùng (bảng auth.users chỉ đọc được qua Admin API). */
async function emailsOf(db: AdminDb, userIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds)];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const { data } = await db.auth.admin.getUserById(id);
      return [id, data.user?.email ?? null] as const;
    })
  );
  return new Map(entries);
}

/**
 * Thành viên + lời mời đang chờ của một workspace.
 * Gọi SAU khi đã kiểm tra quyền owner (requireWorkspace("owner")).
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<{ members: MemberItem[]; invitations: InvitationItem[] }> {
  const db = createSupabaseAdminClient();
  const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
    db
      .from("workspace_members")
      .select("user_id, role, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    db
      .from("workspace_invitations")
      .select("id, email, role, created_at, expires_at")
      .eq("workspace_id", workspaceId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const emails = await emailsOf(
    db,
    (memberRows ?? []).map((m) => m.user_id)
  );
  const now = Date.now();
  return {
    members: (memberRows ?? []).map((m) => ({
      userId: m.user_id,
      email: emails.get(m.user_id) ?? null,
      role: m.role,
      joinedAt: m.created_at,
    })),
    invitations: (inviteRows ?? []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.created_at,
      expiresAt: i.expires_at,
      isExpired: new Date(i.expires_at).getTime() <= now,
    })),
  };
}

/** Tổng quan mọi workspace cho quản trị hệ thống. Gọi SAU khi đã kiểm tra isPlatformAdmin. */
export async function getWorkspacesOverview(): Promise<WorkspaceOverview[]> {
  const db = createSupabaseAdminClient();
  const [ws, members, pages, branches, leads, shells, media, invites] = await Promise.all([
    db
      .from("workspaces")
      .select("id, name, plan, features, max_pages, max_media_bytes, max_branches, max_shells, archived_at")
      .order("created_at"),
    db.from("workspace_members").select("workspace_id, user_id, role"),
    db.from("pages").select("workspace_id").is("archived_at", null),
    db.from("branches").select("workspace_id").is("archived_at", null),
    db.from("leads").select("workspace_id"),
    db.from("site_shells").select("workspace_id"),
    db.from("media_assets").select("workspace_id, size_bytes").is("archived_at", null),
    db
      .from("workspace_invitations")
      .select("workspace_id")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const ownerIds = (members.data ?? []).filter((m) => m.role === "owner").map((m) => m.user_id);
  const emails = await emailsOf(db, ownerIds);

  const countBy = <T extends { workspace_id: string }>(rows: T[] | null) => {
    const map = new Map<string, number>();
    for (const r of rows ?? []) map.set(r.workspace_id, (map.get(r.workspace_id) ?? 0) + 1);
    return map;
  };
  const memberCount = countBy(members.data);
  const pageCount = countBy(pages.data);
  const branchCount = countBy(branches.data);
  const leadCount = countBy(leads.data);
  const shellCount = countBy(shells.data);
  const inviteCount = countBy(invites.data);
  const mediaBytes = new Map<string, number>();
  for (const m of media.data ?? []) {
    mediaBytes.set(
      m.workspace_id,
      (mediaBytes.get(m.workspace_id) ?? 0) + Number(m.size_bytes ?? 0)
    );
  }

  return (ws.data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    plan: (w.plan as WorkspacePlan) ?? "pro",
    features: normalizeWorkspaceFeatures(w.features),
    maxPages: w.max_pages,
    maxMediaBytes: Number(w.max_media_bytes),
    maxBranches: w.max_branches ?? 100,
    maxShells: w.max_shells ?? 10,
    archivedAt: w.archived_at,
    memberCount: memberCount.get(w.id) ?? 0,
    ownerEmails: (members.data ?? [])
      .filter((m) => m.workspace_id === w.id && m.role === "owner")
      .map((m) => emails.get(m.user_id) ?? "(không rõ email)"),
    pageCount: pageCount.get(w.id) ?? 0,
    branchCount: branchCount.get(w.id) ?? 0,
    leadCount: leadCount.get(w.id) ?? 0,
    shellCount: shellCount.get(w.id) ?? 0,
    mediaBytes: mediaBytes.get(w.id) ?? 0,
    pendingInvitations: inviteCount.get(w.id) ?? 0,
  }));
}
