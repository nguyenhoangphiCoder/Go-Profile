import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, RefreshCw } from "lucide-react";
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
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50/60 dark:bg-background">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card shadow-sm space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">Tài khoản chưa được gán Workspace</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bạn đã đăng nhập thành công nhưng chưa có quyền truy cập vào workspace nào trên hệ
            thống.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/50 border border-border/70 space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block">
            Email tài khoản hiện tại
          </span>
          <p className="text-sm font-mono font-semibold text-foreground break-all">
            {ctx.user.email ?? ctx.user.userId}
          </p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Hãy gửi email trên cho <strong>SuperAdmin</strong> hoặc <strong>Chủ sở hữu Workspace</strong>{" "}
          để được cấp quyền, sau đó bấm nút kiểm tra lại bên dưới.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/no-workspace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Kiểm tra lại quyền
          </Link>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
