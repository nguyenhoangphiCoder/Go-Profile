// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb, createUser } from "./harness";

// Mỗi test dựng PostgreSQL (PGlite) và chạy toàn bộ migration: cần nhiều hơn 5 giây khi máy bận
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let db: PGlite;
let wsA: string, wsB: string;

async function invite(ws: string, email: string, role: string, extra = "") {
  await db.query(
    `INSERT INTO public.workspace_invitations (workspace_id, email, role${extra ? ", " + extra.split("=")[0] : ""})
     VALUES ($1, $2, $3${extra ? ", " + extra.split("=")[1] : ""})`,
    [ws, email, role]
  );
}

const accept = (user: string) =>
  asUser(db, user, async (tx) => {
    const r = await tx.query<{ n: number }>("SELECT public.accept_workspace_invitations() AS n");
    return r.rows[0].n;
  });

const membership = async (user: string) =>
  (
    await db.query<{ workspace_id: string; role: string }>(
      "SELECT workspace_id, role FROM public.workspace_members WHERE user_id = $1 ORDER BY role",
      [user]
    )
  ).rows;

beforeEach(async () => {
  db = await createDb();
  const ids = await db.query<{ id: string }>(
    "INSERT INTO public.workspaces (name) VALUES ('A'), ('B') RETURNING id"
  );
  [wsA, wsB] = ids.rows.map((r) => r.id);
});

describe("nhận lời mời workspace", () => {
  it("nhận mọi lời mời còn hạn gửi tới đúng email (không phân biệt hoa thường)", async () => {
    const u = await createUser(db, "Moi@Go.Test");
    await invite(wsA, "moi@go.test", "editor");
    await invite(wsB, "moi@go.test", "viewer");

    expect(await accept(u)).toBe(2);
    expect(await membership(u)).toEqual(
      expect.arrayContaining([
        { workspace_id: wsA, role: "editor" },
        { workspace_id: wsB, role: "viewer" },
      ])
    );
    // gọi lại: không còn gì để nhận
    expect(await accept(u)).toBe(0);
    const inv = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM public.workspace_invitations WHERE accepted_by = $1",
      [u]
    );
    expect(inv.rows[0].n).toBe(2);
  });

  it("email chưa xác minh thì không nhận được lời mời", async () => {
    const u = await createUser(db, "chua@go.test", { confirmed: false });
    await invite(wsA, "chua@go.test", "owner");
    expect(await accept(u)).toBe(0);
    expect(await membership(u)).toEqual([]);
  });

  it("bỏ qua lời mời hết hạn, đã thu hồi, hoặc của workspace đã lưu trữ", async () => {
    const u = await createUser(db, "x@go.test");
    await invite(wsA, "x@go.test", "editor", "expires_at=now() - interval '1 day'");
    await invite(wsB, "x@go.test", "editor", "revoked_at=now()");
    const wsC = (
      await db.query<{ id: string }>(
        "INSERT INTO public.workspaces (name, archived_at) VALUES ('C', now()) RETURNING id"
      )
    ).rows[0].id;
    await invite(wsC, "x@go.test", "editor");
    expect(await accept(u)).toBe(0);
    expect(await membership(u)).toEqual([]);
  });

  it("không nhận lời mời gửi tới email người khác", async () => {
    const u = await createUser(db, "a@go.test");
    await invite(wsA, "b@go.test", "owner");
    expect(await accept(u)).toBe(0);
  });

  it("lời mời không hạ quyền thành viên hiện có, nhưng nâng được quyền", async () => {
    const u = await createUser(db, "m@go.test");
    await db.query(
      "INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner'), ($3, $2, 'viewer')",
      [wsA, u, wsB]
    );
    await invite(wsA, "m@go.test", "viewer");
    await invite(wsB, "m@go.test", "editor");
    expect(await accept(u)).toBe(2);
    expect(await membership(u)).toEqual(
      expect.arrayContaining([
        { workspace_id: wsA, role: "owner" },
        { workspace_id: wsB, role: "editor" },
      ])
    );
  });

  it("khách chưa đăng nhập không gọi được hàm", async () => {
    await expect(
      asUser(db, null, (tx) => tx.query("SELECT public.accept_workspace_invitations()"))
    ).rejects.toThrow(/permission denied/);
  });
});
