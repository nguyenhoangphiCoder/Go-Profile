import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- Giả lập ngữ cảnh workspace + Supabase service role ----
const h = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  const state = {
    ctx: null as null | Record<string, unknown>,
    members: [] as { email: string | null }[],
    tables: {} as Record<string, Row[]>,
    inviteError: null as null | { message: string },
    writes: [] as { table: string; op: string; values?: unknown }[],
    dbError: null as null | { message: string },
    invited: [] as { email: string; redirectTo?: string }[],
  };
  const db = {
    auth: {
      admin: {
        inviteUserByEmail: async (email: string, opts: { redirectTo?: string }) => {
          state.invited.push({ email, redirectTo: opts?.redirectTo });
          return { error: state.inviteError };
        },
      },
    },
    from(table: string) {
      let rows = [...(state.tables[table] ?? [])];
      let op = "select";
      let values: unknown;
      const q = {
        select: () => q,
        insert: (v: unknown) => {
          op = "insert";
          values = v;
          state.writes.push({ table, op, values: v });
          return q;
        },
        update: (v: unknown) => {
          op = "update";
          values = v;
          state.writes.push({ table, op, values: v });
          return q;
        },
        delete: () => {
          op = "delete";
          state.writes.push({ table, op });
          return q;
        },
        eq: (c: string, v: unknown) => ((rows = rows.filter((r) => r[c] === v)), q),
        is: (c: string, v: unknown) => ((rows = rows.filter((r) => (r[c] ?? null) === v)), q),
        maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
        single: () => Promise.resolve({ data: { id: "new-ws-id" }, error: state.dbError }),
        then: (resolve: (r: unknown) => unknown) =>
          resolve(
            state.dbError
              ? { data: null, error: state.dbError }
              : { data: op === "select" ? rows : rows.length ? rows : [{ id: "x" }], error: null }
          ),
      };
      void values;
      return q;
    },
  };
  return { state, db };
});

vi.mock("@/features/workspace/context", () => ({
  getWorkspaceForAction: vi.fn((min: string) =>
    Promise.resolve(
      h.state.ctx && (min !== "owner" || h.state.ctx.role === "owner") ? h.state.ctx : null
    )
  ),
  getWorkspaceContext: vi.fn(() => Promise.resolve(h.state.ctx)),
}));
vi.mock("@/features/workspace/members", () => ({
  getWorkspaceMembers: vi.fn(() => Promise.resolve({ members: h.state.members, invitations: [] })),
}));
vi.mock("@/lib/supabase/privileged", () => ({ createSupabaseAdminClient: () => h.db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  createWorkspaceAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
  setWorkspaceArchivedAction,
  updateMemberRoleAction,
  updateWorkspaceLimitsAction,
} from "@/features/workspace/manage-actions";
import { createWorkspaceSchema, inviteMemberSchema } from "@/features/workspace/schemas";
import { FORBIDDEN_ERROR, GO_CAFE_WORKSPACE_ID } from "@/features/workspace/types";

const UID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const ownerCtx = (extra: Record<string, unknown> = {}) => ({
  user: { userId: "me", email: "me@x.vn", displayName: null },
  isPlatformAdmin: false,
  workspace: { id: "ws-1", name: "B", role: "owner", maxPages: 20, maxMediaBytes: 1 },
  role: "owner",
  workspaces: [],
  ...extra,
});

beforeEach(() => {
  h.state.ctx = ownerCtx();
  h.state.members = [];
  h.state.tables = { workspace_invitations: [] };
  h.state.inviteError = null;
  h.state.writes = [];
  h.state.dbError = null;
  h.state.invited = [];
});

describe("schema", () => {
  it("chuẩn hoá email (trim + chữ thường) và chặn email sai", () => {
    expect(inviteMemberSchema.parse({ email: "  Moi@Go.VN ", role: "editor" }).email).toBe(
      "moi@go.vn"
    );
    expect(
      inviteMemberSchema.safeParse({ email: "khong-phai-email", role: "editor" }).success
    ).toBe(false);
    expect(inviteMemberSchema.safeParse({ email: "a@b.vn", role: "admin" }).success).toBe(false);
  });

  it("giới hạn workspace hợp lệ", () => {
    const ok = createWorkspaceSchema.safeParse({
      name: "Chi nhánh",
      ownerEmail: "a@b.vn",
      maxPages: "20",
      maxMediaMb: "200",
    });
    expect(ok.success).toBe(true);
    expect(
      createWorkspaceSchema.safeParse({
        name: "X",
        ownerEmail: "a@b.vn",
        maxPages: 0,
        maxMediaMb: 200,
      }).success
    ).toBe(false);
  });
});

describe("chặn quyền", () => {
  it.each([
    ["inviteMemberAction", () => inviteMemberAction({ email: "a@b.vn", role: "editor" })],
    ["revokeInvitationAction", () => revokeInvitationAction(UID)],
    ["updateMemberRoleAction", () => updateMemberRoleAction({ userId: UID, role: "viewer" })],
    ["removeMemberAction", () => removeMemberAction(UID)],
  ])("%s cần vai trò owner", async (_n, run) => {
    h.state.ctx = ownerCtx({ role: "editor" });
    expect(await run()).toEqual({ success: false, error: FORBIDDEN_ERROR });
    expect(h.state.writes).toEqual([]);
  });

  it.each([
    [
      "createWorkspaceAction",
      () => createWorkspaceAction({ name: "X", ownerEmail: "a@b.vn", maxPages: 5, maxMediaMb: 50 }),
    ],
    [
      "updateWorkspaceLimitsAction",
      () => updateWorkspaceLimitsAction(UID, { maxPages: 5, maxMediaMb: 50 }),
    ],
    ["setWorkspaceArchivedAction", () => setWorkspaceArchivedAction(UID, true)],
  ])("%s cần quản trị hệ thống (owner workspace thường không được)", async (_n, run) => {
    expect(await run()).toEqual({ success: false, error: FORBIDDEN_ERROR });
    expect(h.state.writes).toEqual([]);
  });
});

describe("mời thành viên", () => {
  it("người mới: lưu lời mời và gửi email với link nhận lời mời", async () => {
    const res = await inviteMemberAction({ email: "Moi@Go.vn", role: "editor" });
    expect(res).toMatchObject({ success: true, message: expect.stringMatching(/Đã gửi email/) });
    expect(h.state.writes[0]).toMatchObject({
      table: "workspace_invitations",
      op: "insert",
      values: { workspace_id: "ws-1", email: "moi@go.vn", role: "editor", invited_by: "me" },
    });
    expect(h.state.invited[0].redirectTo).toMatch(/\/auth\/accept-invite$/);
  });

  it("người đã có tài khoản: vẫn lưu lời mời, báo sẽ tự vào khi đăng nhập", async () => {
    h.state.inviteError = { message: "A user with this email address has already been registered" };
    const res = await inviteMemberAction({ email: "cu@go.vn", role: "viewer" });
    expect(res).toMatchObject({ success: true, message: expect.stringMatching(/đã có tài khoản/) });
  });

  it("đã là thành viên thì báo lỗi, không ghi gì", async () => {
    h.state.members = [{ email: "cu@go.vn" }];
    const res = await inviteMemberAction({ email: "CU@go.vn", role: "viewer" });
    expect(res).toEqual({ success: false, error: "Người này đã là thành viên của workspace." });
    expect(h.state.writes).toEqual([]);
  });

  it("lời mời đang chờ được làm mới (update) thay vì tạo trùng", async () => {
    h.state.tables.workspace_invitations = [
      {
        id: "inv-1",
        workspace_id: "ws-1",
        email: "moi@go.vn",
        accepted_at: null,
        revoked_at: null,
      },
    ];
    await inviteMemberAction({ email: "moi@go.vn", role: "owner" });
    expect(h.state.writes[0]).toMatchObject({ op: "update", values: { role: "owner" } });
  });
});

describe("quản lý thành viên & workspace", () => {
  it("thông báo dễ hiểu khi xoá / hạ quyền chủ sở hữu cuối cùng", async () => {
    h.state.dbError = { message: "Workspace phải còn ít nhất một chủ sở hữu (owner)" };
    expect(await removeMemberAction(UID)).toEqual({
      success: false,
      error: "Không thể xoá chủ sở hữu cuối cùng của workspace.",
    });
    expect((await updateMemberRoleAction({ userId: UID, role: "viewer" })).success).toBe(false);
  });

  it("quản trị hệ thống tạo workspace và mời chủ sở hữu", async () => {
    h.state.ctx = ownerCtx({ isPlatformAdmin: true });
    const res = await createWorkspaceAction({
      name: "Chi nhánh Q7",
      ownerEmail: "Q7@go.vn",
      maxPages: "10",
      maxMediaMb: "100",
    });
    expect(res.success).toBe(true);
    expect(h.state.writes[0]).toMatchObject({
      table: "workspaces",
      op: "insert",
      values: { name: "Chi nhánh Q7", max_pages: 10, max_media_bytes: 100 * 1024 * 1024 },
    });
    expect(h.state.writes.find((w) => w.table === "site_shells")).toMatchObject({
      table: "site_shells",
      op: "insert",
      values: { workspace_id: "new-ws-id", is_default: true },
    });
    expect(h.state.writes.find((w) => w.table === "workspace_invitations")).toMatchObject({
      table: "workspace_invitations",
      values: { workspace_id: "new-ws-id", email: "q7@go.vn", role: "owner" },
    });
  });

  it("không lưu trữ được workspace Gờ Cafe", async () => {
    h.state.ctx = ownerCtx({ isPlatformAdmin: true });
    expect(await setWorkspaceArchivedAction(GO_CAFE_WORKSPACE_ID, true)).toEqual({
      success: false,
      error: "Không thể lưu trữ workspace Gờ Cafe.",
    });
  });
});
