"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Link2, Image, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Bảng điều khiển",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Quản lý trang",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    name: "Danh mục liên kết",
    href: "/admin/links",
    icon: Link2,
  },
  {
    name: "Kho hình ảnh",
    href: "/admin/media",
    icon: Image,
  },
  {
    name: "Báo cáo thống kê",
    href: "/admin/reports",
    icon: BarChart3,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
