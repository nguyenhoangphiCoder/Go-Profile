import { requireWorkspace } from "@/features/workspace/context";
import { getClickReport, getReportFilterOptions } from "@/features/reports/queries";
import { getLeadsReportSummary } from "@/features/leads/queries";
import { LeadsReportSection } from "@/features/reports/components/leads-report-section";
import {
  getPresetDateStrings,
  isValidDateString,
  vietnamDateRangeToUtc,
} from "@/features/reports/timezone";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { ReportSummaryCards } from "@/features/reports/components/report-summary-cards";
import { ReportChart } from "@/features/reports/components/report-chart";
import { ReportBreakdownTabs } from "@/features/reports/components/report-breakdown-tabs";
import { PageHeader } from "@/components/ui/page-header";
import type { DatePresetKey } from "@/features/reports/types";

export const instant = false;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AdminReportsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  await requireWorkspace();
  const resolvedParams = await searchParams;

  const rawPreset = typeof resolvedParams.preset === "string" ? resolvedParams.preset : "last7days";
  let preset: DatePresetKey = ["today", "last7days", "last30days", "thisMonth", "custom"].includes(
    rawPreset
  )
    ? (rawPreset as DatePresetKey)
    : "last7days";

  const rawFrom = typeof resolvedParams.from === "string" ? resolvedParams.from : "";
  const rawTo = typeof resolvedParams.to === "string" ? resolvedParams.to : "";
  // ID không phải UUID sẽ làm RPC lỗi -> bỏ qua bộ lọc thay vì trả lỗi 500
  const pageId =
    typeof resolvedParams.pageId === "string" && UUID_REGEX.test(resolvedParams.pageId)
      ? resolvedParams.pageId
      : undefined;
  const linkId =
    typeof resolvedParams.linkId === "string" && UUID_REGEX.test(resolvedParams.linkId)
      ? resolvedParams.linkId
      : undefined;

  // Xác định khoảng ngày Việt Nam
  let startDateStr: string;
  let endDateStr: string;

  if (preset === "custom" && isValidDateString(rawFrom) && isValidDateString(rawTo)) {
    // Tự đảo lại nếu người dùng chọn ngày bắt đầu sau ngày kết thúc
    [startDateStr, endDateStr] = rawFrom <= rawTo ? [rawFrom, rawTo] : [rawTo, rawFrom];
  } else {
    // Ngày tùy chỉnh thiếu hoặc sai định dạng -> quay về mặc định 7 ngày gần nhất
    if (preset === "custom") preset = "last7days";
    const range = getPresetDateStrings(preset);
    startDateStr = range.startDate;
    endDateStr = range.endDate;
  }

  // Chuyển đổi sang UTC [from, to)
  const { from: fromUtc, to: toUtc } = vietnamDateRangeToUtc(startDateStr, endDateStr);

  // Gọi RPC báo cáo, danh sách bộ lọc và thống kê Leads đồng thời
  const [report, filterOptions, leadsSummary] = await Promise.all([
    getClickReport({
      from: fromUtc,
      to: toUtc,
      pageId,
      linkId,
    }),
    getReportFilterOptions(),
    getLeadsReportSummary({
      from: fromUtc,
      to: toUtc,
      pageId,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Báo cáo thống kê"
        description="Đo lường chi tiết lượt bấm vào liên kết theo trang, liên kết và vị trí đặt (múi giờ Việt Nam)."
      />

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

      {/* Phân tích chi tiết dạng Tabs gọn gàng */}
      <ReportBreakdownTabs report={report} startDateStr={startDateStr} endDateStr={endDateStr} />

      {/* Thống kê chuyển đổi Leads Landing Page */}
      <LeadsReportSection summary={leadsSummary} />
    </div>
  );
}
