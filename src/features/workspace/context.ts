import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  GO_CAFE_WORKSPACE_ID,
  WORKSPACE_COOKIE,
  hasRole,
  type WorkspaceContext,
  type WorkspaceRole,
  type WorkspaceSummary,
} from "./types";

/**
 * Ngữ cảnh workspace của request hiện tại:
 *   - người dùng đăng nhập, có phải quản trị hệ thống (admin_users) không
 *   - các workspace được phép vào (thành viên; quản trị hệ thống: mọi workspace)
 *   - workspace đang chọn (cookie gp_ws, chỉ nhận workspace được phép) + vai trò hiệu lực
 *
 * Quản trị hệ thống có vai trò hiệu lực "owner" ở mọi workspace.
 * Dùng React cache() để chỉ truy vấn một lần trong mỗi request.
 */
export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const [{ data: adminRow }, { data: memberRows }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("display_name, is_active")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("workspace_members").select("workspace_id, role").eq("user_id", user.id),
  ]);

  const isPlatformAdmin = Boolean(adminRow?.is_active);
  const roleByWorkspace = new Map<string, WorkspaceRole>(
    (memberRows ?? []).map((m) => [m.workspace_id, m.role])
  );

  // RLS: thành viên chỉ đọc được workspace của mình; quản trị hệ thống đọc được tất cả
  let wsQuery = supabase
    .from("workspaces")
    .select("id, name, max_pages, max_media_bytes")
    .is("archived_at", null)
    .order("name");
  if (!isPlatformAdmin) {
    const ids = [...roleByWorkspace.keys()];
    if (ids.length === 0) {
      return {
        user: { userId: user.id, email: user.email ?? null, displayName: null },
        isPlatformAdmin,
        workspace: null,
        role: null,
        workspaces: [],
      };
    }
    wsQuery = wsQuery.in("id", ids);
  }
  const { data: wsRows } = await wsQuery;

  const workspaces: WorkspaceSummary[] = (wsRows ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    role: roleByWorkspace.get(w.id) ?? null,
    maxPages: w.max_pages,
    maxMediaBytes: Number(w.max_media_bytes),
  }));

  const cookieStore = await cookies();
  const requested = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const current =
    workspaces.find((w) => w.id === requested) ??
    workspaces.find((w) => w.role !== null && w.id === GO_CAFE_WORKSPACE_ID) ??
    workspaces.find((w) => w.role !== null) ??
    workspaces[0] ??
    null;

  const role: WorkspaceRole | null = current
    ? isPlatformAdmin
      ? "owner"
      : (current.role ?? null)
    : null;

  return {
    user: {
      userId: user.id,
      email: user.email ?? null,
      displayName: adminRow?.display_name ?? null,
    },
    isPlatformAdmin,
    workspace: current,
    role,
    workspaces,
  };
});

export type ActiveWorkspaceContext = WorkspaceContext & {
  workspace: WorkspaceSummary;
  role: WorkspaceRole;
};

/**
 * Dùng trong trang quản trị (server component): bắt buộc đăng nhập và có workspace với vai trò
 * tối thiểu `minRole`. Chưa đăng nhập -> /login; chưa thuộc workspace nào -> /admin/no-workspace;
 * không đủ quyền -> /admin.
 */
export async function requireWorkspace(
  minRole: WorkspaceRole = "viewer"
): Promise<ActiveWorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");
  if (!ctx.workspace || !ctx.role) redirect("/admin/no-workspace");
  if (!hasRole(ctx.role, minRole)) redirect("/admin");
  return ctx as ActiveWorkspaceContext;
}

/**
 * Dùng trong server action: trả về ngữ cảnh nếu đủ quyền, ngược lại null (không redirect).
 * Server action dùng service role (bỏ qua RLS) PHẢI kiểm tra bản ghi thuộc ctx.workspace.id.
 */
export async function getWorkspaceForAction(
  minRole: WorkspaceRole
): Promise<ActiveWorkspaceContext | null> {
  const ctx = await getWorkspaceContext();
  if (!ctx?.workspace || !ctx.role || !hasRole(ctx.role, minRole)) return null;
  return ctx as ActiveWorkspaceContext;
}
