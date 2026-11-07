import { BarChart3 } from "lucide-react";
import { getClickReport, getReportFilterOptions } from "@/features/reports/queries";
import { getPresetDateStrings, vietnamDateRangeToUtc } from "@/features/reports/timezone";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { ReportSummaryCards } from "@/features/reports/components/report-summary-cards";
import { ReportChart } from "@/features/reports/components/report-chart";
import { ReportByPageTable } from "@/features/reports/components/report-by-page-table";
import { ReportByLinkTable } from "@/features/reports/components/report-by-link-table";
import { ReportByPlacementTable } from "@/features/reports/components/report-by-placement-table";
import type { DatePresetKey } from "@/features/reports/types";

export const instant = false;

interface AdminReportsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const resolvedParams = await searchParams;

  const rawPreset = typeof resolvedParams.preset === "string" ? resolvedParams.preset : "last7days";
  const preset: DatePresetKey = [
    "today",
    "last7days",
    "last30days",
    "thisMonth",
    "custom",
  ].includes(rawPreset)
    ? (rawPreset as DatePresetKey)
    : "last7days";

  const rawFrom = typeof resolvedParams.from === "string" ? resolvedParams.from : "";
  const rawTo = typeof resolvedParams.to === "string" ? resolvedParams.to : "";
  const pageId =
    typeof resolvedParams.pageId === "string" && resolvedParams.pageId
      ? resolvedParams.pageId
      : undefined;
  const linkId =
    typeof resolvedParams.linkId === "string" && resolvedParams.linkId
      ? resolvedParams.linkId
      : undefined;

  // Xác định khoảng ngày Việt Nam
  let startDateStr: string;
  let endDateStr: string;

  if (preset === "custom" && rawFrom && rawTo) {
    startDateStr = rawFrom;
    endDateStr = rawTo;
  } else {
    const range = getPresetDateStrings(preset);
    startDateStr = range.startDate;
    endDateStr = range.endDate;
  }

  // Chuyển đổi sang UTC [from, to)
  const { from: fromUtc, to: toUtc } = vietnamDateRangeToUtc(startDateStr, endDateStr);

  // Gọi RPC báo cáo và danh sách bộ lọc đồng thời
  const [report, filterOptions] = await Promise.all([
    getClickReport({
      from: fromUtc,
      to: toUtc,
      pageId,
      linkId,
    }),
    getReportFilterOptions(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Báo cáo thống kê</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Đo lường chi tiết lượt bấm vào liên kết theo trang, liên kết và vị trí đặt (Múi giờ
            Asia/Ho_Chi_Minh).
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <ReportFilters
        currentPreset={preset}
        currentFromDate={startDateStr}
        currentToDate={endDateStr}
        currentPageId={pageId}
        currentLinkId={linkId}
        options={filterOptions}
      />

      {/* Thẻ tổng hợp KPI */}
      <ReportSummaryCards report={report} startDateStr={startDateStr} endDateStr={endDateStr} />

      {/* Biểu đồ thời gian */}
      <ReportChart data={report.by_date} totalClicks={report.total_clicks} />

      {/* Phân rã chi tiết */}
      <div className="space-y-6">
        {/* Bảng theo Trang */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Phân rã theo Trang hồ sơ</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hiệu suất tương tác trên từng trang (bảo toàn dữ liệu cả khi đã lưu trữ hoặc đổi
                slug).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
              {report.by_page.length} trang
            </span>
          </div>
          <ReportByPageTable data={report.by_page} totalClicks={report.total_clicks} />
        </div>

        {/* Bảng theo Liên kết */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Phân rã theo Liên kết</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tổng hợp số lượt click theo liên kết gốc (kể cả khi liên kết được đặt ở nhiều trang
                khác nhau).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
              {report.by_link.length} liên kết
            </span>
          </div>
          <ReportByLinkTable data={report.by_link} totalClicks={report.total_clicks} />
        </div>

        {/* Bảng theo Vị trí (Placement) */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Phân rã theo Vị trí đặt trên Trang
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Đo lường vị trí nút bấm (thứ tự #1, #2...) nhằm tối ưu trải nghiệm giao diện người
                dùng.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
              {report.by_placement.length} vị trí
            </span>
          </div>
          <ReportByPlacementTable data={report.by_placement} totalClicks={report.total_clicks} />
        </div>
      </div>
    </div>
  );
}
