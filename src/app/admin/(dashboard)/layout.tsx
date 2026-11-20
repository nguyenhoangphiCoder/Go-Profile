import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { requireWorkspace } from "@/features/workspace/context";
import { ROLE_LABELS } from "@/features/workspace/types";
import { WorkspaceSwitcher } from "@/components/admin/workspace-switcher";
import { getPrimaryPublicSlug } from "@/features/dashboard/queries";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";

export const instant = false;

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireWorkspace();
  const primarySlug = await getPrimaryPublicSlug(ctx.workspace.id);
  const admin = {
    userId: ctx.user.userId,
    email: ctx.user.email,
    displayName: ctx.user.displayName,
  };
  const nav = { showMembers: ctx.role === "owner", showSystem: ctx.isPlatformAdmin };
  const switcher = {
    workspaces: ctx.workspaces.map((w) => ({ id: w.id, name: w.name })),
    currentId: ctx.workspace.id,
    role: ctx.role,
    isPlatformAdmin: ctx.isPlatformAdmin,
  };

  const publicUrl = primarySlug ? `/${primarySlug}` : null;

  return (
    <div className="h-screen h-dvh flex bg-background text-foreground overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-60 border-r border-border/80 bg-card flex-col shrink-0 hidden md:flex h-full select-none">
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-border/70 gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-border shrink-0 bg-black flex items-center justify-center">
            <Image
              src="/logo-gocafe.png"
              alt="Gờ Cafe"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[13px] leading-none block text-foreground truncate">
              Gờ Cafe Profile
            </span>
            <span className="text-[11px] text-muted-foreground leading-none block mt-1">
              Quản trị nội dung
            </span>
          </div>
        </div>

        {/* Workspace đang làm việc */}
        <div className="px-3.5 py-3 border-b border-border/70 shrink-0">
          <WorkspaceSwitcher {...switcher} />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <AdminNav {...nav} />
        </div>

        {/* User Card */}
        <div className="p-3.5 border-t border-border/70 bg-muted/30 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
              {admin.displayName ? admin.displayName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-semibold block truncate text-foreground">
                {admin.displayName || "Quản trị viên"}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {admin.email || admin.userId.slice(0, 8)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              {ctx.isPlatformAdmin && <ShieldCheck className="w-3.5 h-3.5 text-foreground" />}
              <span>{ctx.isPlatformAdmin ? "Quản trị hệ thống" : ROLE_LABELS[ctx.role]}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 border-b border-border/70 flex items-center justify-between px-4 md:hidden bg-card/95 backdrop-blur-md shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <MobileSidebar admin={admin} nav={nav} />
            <div className="max-w-[9.5rem]">
              <WorkspaceSwitcher {...switcher} compact />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {publicUrl ? (
              <Link
                href={publicUrl}
                className="text-xs text-foreground font-medium hover:underline inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Xem Web</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">Chưa xuất bản</span>
            )}
            <LogoutButton />
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="h-14 border-b border-border/70 hidden md:flex items-center justify-between px-8 bg-card/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span>Workspace</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-semibold">{ctx.workspace.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {publicUrl ? (
              <Link
                href={publicUrl}
                className="text-xs font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Xem trang công khai</span>
                <span className="font-mono text-[11px] text-muted-foreground">({publicUrl})</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ) : (
              <span
                className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-border cursor-default opacity-75"
                title="Chưa có trang nào được xuất bản"
              >
                <span>Chưa có trang xuất bản</span>
              </span>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
