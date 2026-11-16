"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "./context";
import { WORKSPACE_COOKIE } from "./types";

/** Chuyển workspace đang làm việc (chỉ nhận workspace người dùng được phép vào). */
export async function switchWorkspaceAction(
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { success: false, error: "Phiên đăng nhập đã hết hạn." };
  if (!ctx.workspaces.some((w) => w.id === workspaceId)) {
    return { success: false, error: "Bạn không có quyền vào workspace này." };
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/admin", "layout");
  return { success: true };
}
