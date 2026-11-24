"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Globe,
  MapPin,
  Inbox,
  Link2,
  Image as ImageIcon,
  BarChart3,
  Users,
  ShieldCheck,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceFeatures } from "@/features/workspace/types";

function NavPendingSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto shrink-0 opacity-70" />;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  feature?: keyof WorkspaceFeatures;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const BASE_GROUPS: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      {
        name: "Bảng điều khiển",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        name: "Hướng dẫn sử dụng",
        href: "/admin/guide",
        icon: BookOpen,
      },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { name: "Quản lý trang", href: "/admin/pages", icon: FileText },
      { name: "Cấu hình Website", href: "/admin/site", icon: Globe, feature: "landing" },
      { name: "Hệ thống chi nhánh", href: "/admin/branches", icon: MapPin, feature: "branches" },
      { name: "Khách hàng (Leads)", href: "/admin/leads", icon: Inbox, feature: "leads" },
      { name: "Danh mục liên kết", href: "/admin/links", icon: Link2 },
      { name: "Kho hình ảnh", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    label: "Phân tích",
    items: [{ name: "Báo cáo thống kê", href: "/admin/reports", icon: BarChart3 }],
  },
];

const MEMBERS_ITEM: NavItem = { name: "Thành viên", href: "/admin/members", icon: Users };
const SYSTEM_ITEM: NavItem = {
  name: "Quản trị hệ thống",
  href: "/admin/system",
  icon: ShieldCheck,
};

export interface AdminNavProps {
  showMembers?: boolean;
  showSystem?: boolean;
  features?: WorkspaceFeatures;
  isPlatformAdmin?: boolean;
}

export function AdminNav({
  showMembers = false,
  showSystem = false,
  features,
  isPlatformAdmin = false,
}: AdminNavProps) {
  const pathname = usePathname();

  const adminItems: NavItem[] = [
    ...(showMembers ? [MEMBERS_ITEM] : []),
    ...(showSystem ? [SYSTEM_ITEM] : []),
  ];

  const filteredBaseGroups: NavGroup[] = BASE_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.feature || isPlatformAdmin || !features) return true;
      return Boolean(features[item.feature]);
    }),
  })).filter((group) => group.items.length > 0);

  const groups: NavGroup[] = [
    ...filteredBaseGroups,
    ...(adminItems.length > 0 ? [{ label: "Quản trị", items: adminItems }] : []),
  ];

  return (
    <nav className="space-y-5" aria-label="Điều hướng chính">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/75">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground font-medium hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  <NavPendingSpinner />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
