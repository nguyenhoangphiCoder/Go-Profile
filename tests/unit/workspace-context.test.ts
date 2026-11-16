import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasRole } from "@/features/workspace/types";

// ---- Giả lập phiên Supabase + cookie ----
type Row = Record<string, unknown>;
let authUser: { id: string; email: string } | null = null;
let tables: Record<string, Row[]> = {};
let cookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "gp_ws" && cookieValue ? { name, value: cookieValue } : undefined,
    }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getUser: () => Promise.resolve({ data: { user: authUser }, error: null }) },
      from: (table: string) => {
        let rows = [...(tables[table] ?? [])];
        const q = {
          select: () => q,
          eq: (c: string, v: unknown) => ((rows = rows.filter((r) => r[c] === v)), q),
          in: (c: string, vs: unknown[]) => ((rows = rows.filter((r) => vs.includes(r[c]))), q),
          is: (c: string, v: unknown) => ((rows = rows.filter((r) => (r[c] ?? null) === v)), q),
          order: () => q,
          maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
          then: (resolve: (r: unknown) => unknown) => resolve({ data: rows, error: null }),
        };
        return q;
      },
    }),
}));

// React cache() giữ kết quả theo request; trong test mỗi lần gọi phải tính lại
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

import {
  getWorkspaceContext,
  getWorkspaceForAction,
  requireWorkspace,
} from "@/features/workspace/context";

const GO = "00000000-0000-4000-8000-000000000001";
const B = "ws-b";
const ws = (id: string, name: string) => ({
  id,
  name,
  max_pages: 20,
  max_media_bytes: 1000,
  archived_at: null,
});

beforeEach(() => {
  authUser = { id: "u1", email: "u1@test.vn" };
  cookieValue = undefined;
  tables = {
    admin_users: [],
    workspace_members: [],
    workspaces: [ws(GO, "Gờ Cafe"), ws(B, "Chi nhánh B")],
  };
});

describe("hasRole", () => {
  it("owner > editor > viewer", () => {
    expect(hasRole("owner", "editor")).toBe(true);
    expect(hasRole("editor", "editor")).toBe(true);
    expect(hasRole("viewer", "editor")).toBe(false);
    expect(hasRole("editor", "owner")).toBe(false);
  });
});

describe("getWorkspaceContext", () => {
  it("chưa đăng nhập -> null", async () => {
    authUser = null;
    expect(await getWorkspaceContext()).toBeNull();
  });

  it("thành viên chỉ thấy workspace của mình, vai trò đúng như được cấp", async () => {
    tables.workspace_members = [{ user_id: "u1", workspace_id: B, role: "editor" }];
    const ctx = (await getWorkspaceContext())!;
    expect(ctx.isPlatformAdmin).toBe(false);
    expect(ctx.workspaces.map((w) => w.id)).toEqual([B]);
    expect(ctx.workspace?.id).toBe(B);
    expect(ctx.role).toBe("editor");
  });

  it("cookie trỏ tới workspace không được phép thì bị bỏ qua", async () => {
    tables.workspace_members = [{ user_id: "u1", workspace_id: B, role: "viewer" }];
    cookieValue = GO; // không phải thành viên Gờ Cafe
    const ctx = (await getWorkspaceContext())!;
    expect(ctx.workspace?.id).toBe(B);
    expect(ctx.role).toBe("viewer");
  });

  it("cookie hợp lệ chọn đúng workspace", async () => {
    tables.workspace_members = [
      { user_id: "u1", workspace_id: GO, role: "viewer" },
      { user_id: "u1", workspace_id: B, role: "owner" },
    ];
    cookieValue = B;
    const ctx = (await getWorkspaceContext())!;
    expect(ctx.workspace?.id).toBe(B);
    expect(ctx.role).toBe("owner");
  });

  it("quản trị hệ thống thấy mọi workspace và có quyền owner ở cả workspace không là thành viên", async () => {
    tables.admin_users = [{ user_id: "u1", is_active: true, display_name: "Admin" }];
    tables.workspace_members = [{ user_id: "u1", workspace_id: GO, role: "owner" }];
    const ctx = (await getWorkspaceContext())!;
    expect(ctx.isPlatformAdmin).toBe(true);
    expect(ctx.workspaces.map((w) => w.id).sort()).toEqual([B, GO].sort());
    expect(ctx.workspace?.id).toBe(GO); // mặc định Gờ Cafe
    cookieValue = B;
    const ctx2 = (await getWorkspaceContext())!;
    expect(ctx2.workspace?.id).toBe(B);
    expect(ctx2.role).toBe("owner");
    expect(ctx2.workspace?.role).toBeNull(); // không phải thành viên thật
  });

  it("quản trị viên bị vô hiệu hoá không còn quyền hệ thống", async () => {
    tables.admin_users = [{ user_id: "u1", is_active: false }];
    const ctx = (await getWorkspaceContext())!;
    expect(ctx.isPlatformAdmin).toBe(false);
    expect(ctx.workspace).toBeNull();
  });
});

describe("requireWorkspace / getWorkspaceForAction", () => {
  it("chưa đăng nhập -> /login; chưa thuộc workspace -> /admin/no-workspace", async () => {
    authUser = null;
    await expect(requireWorkspace()).rejects.toThrow("REDIRECT:/login");
    authUser = { id: "u1", email: "u1@test.vn" };
    await expect(requireWorkspace()).rejects.toThrow("REDIRECT:/admin/no-workspace");
  });

  it("viewer không vào được trang cần quyền editor; action ghi trả null", async () => {
    tables.workspace_members = [{ user_id: "u1", workspace_id: B, role: "viewer" }];
    await expect(requireWorkspace("editor")).rejects.toThrow("REDIRECT:/admin");
    expect(await getWorkspaceForAction("editor")).toBeNull();
    expect((await getWorkspaceForAction("viewer"))?.workspace.id).toBe(B);
  });
});
