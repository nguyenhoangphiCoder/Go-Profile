import Link from "next/link";
import { Plus, Link2, BarChart3, FileText, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { requireActiveAdmin } from "@/features/auth/queries";

export const instant = false;

export default async function AdminDashboardPage() {
  const admin = await requireActiveAdmin();

  return (
    <div className="max-w-6xl space-y-8">
      {/* Welcome Hero */}
      <div className="p-6 md:p-8 rounded-3xl border border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Bảng điều khiển
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Xin chào, {admin.displayName || "Quản trị viên"}!
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Quản trị các trang hồ sơ, danh mục liên kết và theo dõi hiệu quả truy cập của Gờ Cafe.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo trang mới</span>
          </Link>
          <Link
            href="/admin/links"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Link2 className="w-4 h-4" />
            <span>Quản lý link</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl border border-border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Trang xuất bản</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold">3 trang</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              /gocafe, /tuyendung, /nhuongquyen
            </p>
          </div>
          <div className="pt-2 border-t border-border/60">
            <Link
              href="/admin/pages"
              className="text-xs text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <span>Xem danh sách trang</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl border border-border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Kho liên kết chung</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold">8 liên kết</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ShopeeFood, Grab, Menu, Maps, Hotline...
            </p>
          </div>
          <div className="pt-2 border-t border-border/60">
            <Link
              href="/admin/links"
              className="text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <span>Quản lý liên kết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl border border-border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Tổng lượt click ghi nhận
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold">17 lượt</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              12 click (/gocafe) + 5 click (/tuyendung)
            </p>
          </div>
          <div className="pt-2 border-t border-border/60">
            <Link
              href="/admin/reports"
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <span>Xem báo cáo chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Security & System Info */}
      <div className="p-6 rounded-2xl border border-border bg-muted/20 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Hệ thống bảo mật và phân quyền đã kích hoạt</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 rounded-xl bg-background border border-border">
            <span className="font-medium text-foreground block mb-1">Xác thực phiên (Session)</span>
            Duy trì qua HTTP-Only cookie, tự động refresh qua Proxy Next.js 16.
          </div>
          <div className="p-3 rounded-xl bg-background border border-border">
            <span className="font-medium text-foreground block mb-1">Row Level Security</span>
            Khóa toàn bộ DML trực tiếp, kiểm tra nghiêm ngặt `admin_users.is_active`.
          </div>
          <div className="p-3 rounded-xl bg-background border border-border">
            <span className="font-medium text-foreground block mb-1">Ranh giới Server-Only</span>
            Secret Key và các RPC ghi nhận không bị lộ vào client bundle.
          </div>
        </div>
      </div>
    </div>
  );
}
