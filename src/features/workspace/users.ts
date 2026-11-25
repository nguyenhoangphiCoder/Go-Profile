import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import { listAllAuthUsers } from "./auth-users-helper";
import type { WorkspaceRole } from "./types";

export interface PlatformUserMembership {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
}

export interface PlatformUserItem {
  userId: string;
  email: string;
  displayName: string | null;
  isSuperAdmin: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  memberships: PlatformUserMembership[];
}

/**
 * Liệt kê toàn bộ tài khoản trên nền tảng kèm quyền SuperAdmin và danh sách Workspace.
 * Chỉ gọi SAU khi đã xác thực `ctx.isPlatformAdmin`.
 */
export async function getPlatformUsersOverview(): Promise<PlatformUserItem[]> {
  const db = createSupabaseAdminClient();

  const [authUsers, adminsRes, membersRes, wsRes] = await Promise.all([
    listAllAuthUsers(db),
    db.from("admin_users").select("user_id, display_name, is_active"),
    db.from("workspace_members").select("user_id, workspace_id, role"),
    db.from("workspaces").select("id, name"),
  ]);

  const wsNameMap = new Map<string, string>((wsRes.data ?? []).map((w) => [w.id, w.name]));
  const adminMap = new Map<string, { displayName: string | null; isActive: boolean }>(
    (adminsRes.data ?? []).map((a) => [
      a.user_id,
      { displayName: a.display_name ?? null, isActive: Boolean(a.is_active) },
    ])
  );

  const membershipsByUser = new Map<string, PlatformUserMembership[]>();
  for (const m of membersRes.data ?? []) {
    const list = membershipsByUser.get(m.user_id) ?? [];
    list.push({
      workspaceId: m.workspace_id,
      workspaceName: wsNameMap.get(m.workspace_id) ?? "(Workspace đã xóa)",
      role: m.role,
    });
    membershipsByUser.set(m.user_id, list);
  }

  const now = Date.now();

  return authUsers
    .map((u) => {
      const admin = adminMap.get(u.id);
      const bannedUntil = (u as unknown as { banned_until?: string | null }).banned_until ?? null;
      const isBanned = Boolean(bannedUntil && new Date(bannedUntil).getTime() > now);
      const metaName =
        typeof u.user_metadata?.display_name === "string"
          ? u.user_metadata.display_name
          : typeof u.user_metadata?.full_name === "string"
            ? u.user_metadata.full_name
            : null;

      return {
        userId: u.id,
        email: u.email ?? "(không có email)",
        displayName: admin?.displayName ?? metaName,
        isSuperAdmin: Boolean(admin?.isActive),
        isBanned,
        bannedUntil,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        memberships: membershipsByUser.get(u.id) ?? [],
      };
    })
    .sort((a, b) => {
      if (a.isSuperAdmin !== b.isSuperAdmin) return a.isSuperAdmin ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}
