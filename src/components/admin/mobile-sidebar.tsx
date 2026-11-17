"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";
import { AdminNav, type AdminNavProps } from "./admin-nav";
import { LogoutButton } from "./logout-button";

interface MobileSidebarProps {
  admin: {
    displayName: string | null;
    email: string | null;
    userId: string;
  };
  nav?: AdminNavProps;
}

export function MobileSidebar({ admin, nav }: MobileSidebarProps) {
  const pathname = usePathname();
  // Ghi nhớ trang lúc mở menu: khi điều hướng sang trang khác, pathname đổi -> menu tự đóng
  // (không cần useEffect + setState).
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const isOpen = openedAtPath !== null && openedAtPath === pathname;
  const setIsOpen = (open: boolean) => setOpenedAtPath(open ? pathname : null);

  // Khóa cuộn trang nền và cho phép đóng bằng phím Esc khi menu đang mở
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAtPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer md:hidden"
        title="Mở menu điều hướng"
        aria-label="Mở menu điều hướng"
        aria-expanded={isOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/*
        Render qua portal ra document.body: header mobile dùng backdrop-blur (backdrop-filter),
        thuộc tính này biến header thành "containing block" cho mọi phần tử position:fixed bên trong,
        khiến drawer bị ép vào khung header cao 64px. Portal giúp drawer phủ đúng toàn màn hình.
      */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] md:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer Sidebar */}
            <aside className="relative w-72 max-w-[85vw] bg-card border-r border-border/80 text-foreground flex flex-col h-dvh max-h-dvh shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              {/* Header / Brand */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-border/60 shrink-0">
                <div className="flex items-center gap-3">
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
                  <div>
                    <span className="font-bold text-sm leading-none block text-foreground">
                      Gờ Cafe CMS
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-none block mt-1">
                      Quản trị liên kết
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Đóng menu"
                  aria-label="Đóng menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 p-4 overflow-y-auto">
                <AdminNav {...nav} />
              </div>

              {/* User Footer */}
              <div className="p-4 pb-safe border-t border-border/60 bg-muted/20 space-y-3 shrink-0">
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
          </div>,
          document.body
        )}
    </>
  );
}
