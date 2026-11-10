import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { requireActiveAdmin } from "@/features/auth/queries";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";

export const instant = false;

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireActiveAdmin();

  return (
    <div className="h-screen h-dvh flex bg-slate-50/60 dark:bg-background text-foreground overflow-hidden">
      {/* Sidebar Desktop (Fixed in place, independent internal scroll) */}
      <aside className="w-64 border-r border-border/80 bg-card flex flex-col shrink-0 hidden md:flex h-full select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border/60 gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-xs shrink-0 bg-black flex items-center justify-center">
            <Image
              src="/logo-gocafe.png"
              alt="Gờ Cafe"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <span className="font-bold text-sm leading-none block text-foreground">Gờ Cafe CMS</span>
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
        <div className="p-4 border-t border-border/60 bg-muted/20 space-y-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {admin.displayName ? admin.displayName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold block truncate text-foreground">
                {admin.displayName || "Quản trị viên"}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {admin.email || admin.userId.slice(0, 8)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header (Fixed at top) */}
        <header className="h-16 border-b border-border/60 flex items-center justify-between px-4 md:hidden bg-card/95 backdrop-blur-md shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <MobileSidebar admin={admin} />
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-xs shrink-0 bg-black flex items-center justify-center">
              <Image
                src="/logo-gocafe.png"
                alt="Gờ Cafe"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="font-bold text-sm text-foreground">Gờ Cafe CMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
              target="_blank"
            >
              <span>Xem Web</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* Desktop Topbar / Header (Fixed at top) */}
        <header className="h-16 border-b border-border/60 hidden md:flex items-center justify-between px-8 bg-card/95 backdrop-blur-md shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Khu vực quản trị</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">CMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 hover:bg-muted"
              target="_blank"
            >
              <span>Xem trang công khai</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content Body (Independent scrolling area) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
