export type WorkspaceRole = "owner" | "editor" | "viewer";

/** Workspace Gờ Cafe tạo bởi migration 20261116000005 (chứa toàn bộ dữ liệu cũ). */
export const GO_CAFE_WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

/** Cookie lưu workspace đang chọn trong khu vực quản trị. */
export const WORKSPACE_COOKIE = "gp_ws";

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Chủ sở hữu",
  editor: "Biên tập viên",
  viewer: "Người xem",
};

const ROLE_RANK: Record<WorkspaceRole, number> = { viewer: 1, editor: 2, owner: 3 };

/** Vai trò `role` có đủ quyền của `minRole` không (owner > editor > viewer). */
export function hasRole(role: WorkspaceRole, minRole: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  /** Vai trò thành viên thật; null nếu người dùng chỉ vào được nhờ quyền quản trị hệ thống. */
  role: WorkspaceRole | null;
  maxPages: number;
  maxMediaBytes: number;
}

export interface WorkspaceContext {
  user: { userId: string; email: string | null; displayName: string | null };
  isPlatformAdmin: boolean;
  workspace: WorkspaceSummary | null;
  /** Vai trò hiệu lực trong workspace đang chọn (quản trị hệ thống = owner). */
  role: WorkspaceRole | null;
  workspaces: WorkspaceSummary[];
}

/** Thông báo lỗi chung khi không đủ quyền trong server action. */
export const FORBIDDEN_ERROR =
  "Bạn không có quyền thực hiện thao tác này trong workspace hiện tại, hoặc phiên đăng nhập đã hết hạn.";
