import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/features/workspace/context";
import { acceptPendingInvitations } from "@/features/workspace/invitations";
import { LogoutButton } from "@/components/admin/logout-button";

export const metadata: Metadata = {
  title: "Chưa có workspace | Gờ Cafe",
  robots: { index: false, follow: false },
};

export const instant = false;

/** Người đã đăng nhập nhưng chưa thuộc workspace nào (lời mời chưa được nhận / đã bị xoá khỏi workspace). */
export default async function NoWorkspacePage() {
  await acceptPendingInvitations();
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");
  if (ctx.workspace) redirect("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50/60">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card shadow-sm space-y-4 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="text-xl font-bold">Bạn chưa thuộc workspace nào</h1>
        <p className="text-sm text-muted-foreground">
          Tài khoản <strong>{ctx.user.email}</strong> đã đăng nhập nhưng chưa được thêm vào
          workspace nào. Hãy nhờ chủ sở hữu workspace gửi lời mời tới đúng email này, rồi đăng nhập
          lại.
        </p>
        <div className="pt-2 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
