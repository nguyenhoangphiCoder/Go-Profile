export type WorkspaceRole = "owner" | "editor" | "viewer";
export type WorkspacePlan = "free" | "pro" | "enterprise";

export interface WorkspaceFeatures {
  landing: boolean;
  branches: boolean;
  leads: boolean;
  tracking: boolean;
  customDomains: boolean;
}

export const DEFAULT_WORKSPACE_FEATURES: WorkspaceFeatures = {
  landing: true,
  branches: true,
  leads: true,
  tracking: true,
  customDomains: false,
};

export const PLAN_LABELS: Record<WorkspacePlan, string> = {
  free: "Cơ bản (Free)",
  pro: "Chuyên nghiệp (Pro)",
  enterprise: "Doanh nghiệp (Enterprise)",
};

export const PLAN_PRESETS: Record<
  WorkspacePlan,
  {
    maxPages: number;
    maxMediaMb: number;
    maxBranches: number;
    maxShells: number;
    features: WorkspaceFeatures;
  }
> = {
  free: {
    maxPages: 5,
    maxMediaMb: 100,
    maxBranches: 0,
    maxShells: 1,
    features: {
      landing: true,
      branches: false,
      leads: false,
      tracking: false,
      customDomains: false,
    },
  },
  pro: {
    maxPages: 30,
    maxMediaMb: 500,
    maxBranches: 100,
    maxShells: 10,
    features: {
      landing: true,
      branches: true,
      leads: true,
      tracking: true,
      customDomains: false,
    },
  },
  enterprise: {
    maxPages: 200,
    maxMediaMb: 2048,
    maxBranches: 500,
    maxShells: 50,
    features: {
      landing: true,
      branches: true,
      leads: true,
      tracking: true,
      customDomains: true,
    },
  },
};

export function normalizeWorkspaceFeatures(raw: unknown): WorkspaceFeatures {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_WORKSPACE_FEATURES };
  }
  const obj = raw as Record<string, unknown>;
  return {
    landing: typeof obj.landing === "boolean" ? obj.landing : true,
    branches: typeof obj.branches === "boolean" ? obj.branches : true,
    leads: typeof obj.leads === "boolean" ? obj.leads : true,
    tracking: typeof obj.tracking === "boolean" ? obj.tracking : true,
    customDomains: typeof obj.customDomains === "boolean" ? obj.customDomains : false,
  };
}

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
  plan: WorkspacePlan;
  features: WorkspaceFeatures;
  /** Vai trò thành viên thật; null nếu người dùng chỉ vào được nhờ quyền quản trị hệ thống. */
  role: WorkspaceRole | null;
  maxPages: number;
  maxMediaBytes: number;
  maxBranches: number;
  maxShells: number;
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
