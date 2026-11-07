import Link from "next/link";
import { Coffee, ShieldCheck } from "lucide-react";
import { requireActiveAdmin } from "@/features/auth/queries";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireActiveAdmin();

  return (
    <div className="min-h-screen flex bg-slate-50/60 text-foreground">
      {/* Sidebar Desktop */}
      <aside className="w-64 border-r border-border bg-white flex flex-col shrink-0 hidden md:flex">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border/60 gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white shadow-xs shadow-blue-500/20 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm leading-none block text-slate-900">Gờ Cafe CMS</span>
            <span className="text-[11px] text-muted-foreground leading-none block mt-1">
              Quản trị liên kết
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 p-4 overflow-y-auto">
          <AdminNav />
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-border/60 bg-blue-50/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {admin.displayName ? admin.displayName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold block truncate text-slate-900">
                {admin.displayName || "Quản trị viên"}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {admin.email || admin.userId.slice(0, 8)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border/60 flex items-center justify-between px-4 md:hidden bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900">Gờ Cafe CMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-blue-600 font-medium hover:text-blue-700"
              target="_blank"
            >
              Xem Web
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="h-16 border-b border-border/60 hidden md:flex items-center justify-between px-8 bg-white">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Khu vực quản trị</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">CMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              target="_blank"
            >
              ↗ Xem trang công khai
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
