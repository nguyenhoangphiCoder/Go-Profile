import Link from "next/link";
import {
  Plus,
  Link2,
  BarChart3,
  FileText,
  ArrowUpRight,
  Image as ImageIcon,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { requireWorkspace } from "@/features/workspace/context";
import { hasRole } from "@/features/workspace/types";
import { getDashboardSummary } from "@/features/dashboard/queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";

export const instant = false;

export default async function AdminDashboardPage() {
  const ctx = await requireWorkspace();
  const summary = await getDashboardSummary(ctx.workspace.id);
  const displayName = ctx.user.displayName || ctx.user.email || "Quản trị viên";
  const canEdit = hasRole(ctx.role, "editor");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title={`Xin chào, ${displayName}`}
        description="Tổng quan các trang hồ sơ, kho liên kết và hiệu quả tương tác của workspace hiện tại."
        action={
          <>
            <Link
              href="/admin/links"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span>Kho liên kết</span>
            </Link>
            {canEdit && (
              <Link
                href="/admin/pages/new"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo trang mới</span>
              </Link>
            )}
          </>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">
              Trang đang xuất bản
            </span>
            <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {summary.publishedPagesCount}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                / {summary.totalPagesCount} trang
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {summary.pagesSummaryText}
            </p>
          </div>
          <div className="pt-3 border-t border-border/60">
            <Link
              href="/admin/pages"
              className="text-xs font-medium text-foreground hover:text-muted-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Quản lý tất cả trang</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">
              Kho liên kết chung
            </span>
            <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {summary.totalLinksCount}
            </span>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {summary.linksSummaryText}
            </p>
          </div>
          <div className="pt-3 border-t border-border/60">
            <Link
              href="/admin/links"
              className="text-xs font-medium text-foreground hover:text-muted-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Mở danh mục liên kết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground">
              Tổng lượt bấm ghi nhận
            </span>
            <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {summary.totalClicksCount.toLocaleString("vi-VN")}
            </span>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {summary.clicksSummaryText}
            </p>
          </div>
          <div className="pt-3 border-t border-border/60">
            <Link
              href="/admin/reports"
              className="text-xs font-medium text-foreground hover:text-muted-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Xem báo cáo chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Pages + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Trang cập nhật gần đây</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Truy cập nhanh để chỉnh sửa nội dung hoặc xem trang công khai
              </p>
            </div>
            <Link
              href="/admin/pages"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Xem tất cả
            </Link>
          </div>

          {summary.recentPages.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">Chưa có trang hồ sơ nào</p>
              <p className="text-xs text-muted-foreground">
                Bắt đầu bằng cách tạo trang hồ sơ đầu tiên cho workspace của bạn.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {summary.recentPages.map((p) => (
                <li
                  key={p.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="text-[13px] font-semibold text-foreground hover:underline truncate"
                      >
                        {p.internalName}
                      </Link>
                      <StatusBadge tone={p.status === "published" ? "success" : "warning"}>
                        {p.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {p.slug && <span className="font-mono text-[11px]">/{p.slug}</span>}
                      <span>•</span>
                      <span className="tabular-nums">
                        Cập nhật {new Date(p.updatedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.status === "published" && p.slug && (
                      <a
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors"
                        title="Xem trang công khai"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Sửa</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Shortcuts */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-2xs p-5 space-y-4 self-start">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Lối tắt nhanh</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Các thao tác dùng thường xuyên</p>
          </div>
          <div className="space-y-2">
            {canEdit && (
              <Link
                href="/admin/pages/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:bg-muted/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold text-foreground block">
                    Tạo trang hồ sơ mới
                  </span>
                  <span className="text-xs text-muted-foreground block truncate">
                    Khởi tạo slug và trình bày nội dung
                  </span>
                </div>
              </Link>
            )}
            <Link
              href="/admin/media"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:bg-muted/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-foreground block">
                  Kho hình ảnh
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  Tải lên ảnh đại diện, banner, icon
                </span>
              </div>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:bg-muted/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-foreground block">
                  Báo cáo hiệu suất
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  Theo dõi lượt bấm theo ngày & kênh
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
