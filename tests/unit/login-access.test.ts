import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  isAdmin: false,
  memberships: 0,
  accepted: 0,
  signOut: vi.fn(),
  acceptCalls: 0,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: {
        signInWithPassword: () =>
          Promise.resolve({ data: { user: { id: "u1", email: "u1@x.vn" } }, error: null }),
        signOut: h.signOut,
      },
      from: (table: string) => {
        const q = {
          select: () => q,
          eq: () => q,
          maybeSingle: () =>
            Promise.resolve({
              data:
                table === "admin_users" && h.isAdmin ? { user_id: "u1", is_active: true } : null,
            }),
          then: (resolve: (r: unknown) => unknown) =>
            resolve({ count: h.memberships + h.accepted, error: null }),
        };
        return q;
      },
    }),
}));
vi.mock("@/features/workspace/invitations", () => ({
  acceptPendingInvitations: () => {
    h.acceptCalls++;
    return Promise.resolve(h.accepted);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error(`REDIRECT:${url}`), { digest: "NEXT_REDIRECT" });
  },
  unstable_rethrow: (err: unknown) => {
    if (err instanceof Error && err.message.startsWith("REDIRECT:")) throw err;
  },
}));

import { loginAction } from "@/features/auth/actions";

const form = () => {
  const fd = new FormData();
  fd.set("email", "u1@x.vn");
  fd.set("password", "mat-khau-dai");
  fd.set("redirectTo", "/admin/pages");
  return fd;
};

beforeEach(() => {
  h.isAdmin = false;
  h.memberships = 0;
  h.accepted = 0;
  h.acceptCalls = 0;
  h.signOut.mockClear();
});

describe("đăng nhập theo workspace", () => {
  it("quản trị hệ thống vào được", async () => {
    h.isAdmin = true;
    await expect(loginAction({}, form())).rejects.toThrow("REDIRECT:/admin/pages");
    expect(h.signOut).not.toHaveBeenCalled();
  });

  it("thành viên workspace (không phải quản trị hệ thống) vào được", async () => {
    h.memberships = 1;
    await expect(loginAction({}, form())).rejects.toThrow("REDIRECT:/admin/pages");
  });

  it("người có lời mời đang chờ: nhận lời mời ngay khi đăng nhập rồi vào được", async () => {
    h.accepted = 1;
    await expect(loginAction({}, form())).rejects.toThrow("REDIRECT:/admin/pages");
    expect(h.acceptCalls).toBe(1);
  });

  it("không thuộc workspace nào: bị đăng xuất ngay và nhận thông báo", async () => {
    const res = await loginAction({}, form());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/chưa thuộc workspace nào/);
    expect(h.signOut).toHaveBeenCalled();
  });
});
