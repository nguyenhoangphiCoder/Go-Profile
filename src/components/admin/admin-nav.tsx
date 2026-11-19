"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Link2,
  Image,
  BarChart3,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavPendingSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto shrink-0 opacity-80" />;
}

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

/** Mục chỉ hiện theo quyền: Thành viên (owner), Quản trị hệ thống (quản trị hệ thống). */
const MEMBERS_ITEM = { name: "Thành viên", href: "/admin/members", icon: Users };
const SYSTEM_ITEM = { name: "Quản trị hệ thống", href: "/admin/system", icon: ShieldCheck };

export interface AdminNavProps {
  showMembers?: boolean;
  showSystem?: boolean;
}

export function AdminNav({ showMembers = false, showSystem = false }: AdminNavProps) {
  const pathname = usePathname();
  const items: { name: string; href: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    ...NAV_ITEMS,
    ...(showMembers ? [MEMBERS_ITEM] : []),
    ...(showSystem ? [SYSTEM_ITEM] : []),
  ];

  return (
    <nav className="space-y-1">
      {items.map((item) => {
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
                ? "bg-primary text-primary-foreground shadow-xs shadow-blue-500/20"
                : "text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.name}</span>
            <NavPendingSpinner />
          </Link>
        );
      })}
    </nav>
  );
}
