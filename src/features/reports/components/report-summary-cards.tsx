import { MousePointerClick, FileText, Link2, Clock, Info } from "lucide-react";
import { formatDisplayDate, formatVietnamDateTime } from "../timezone";
import type { ClickReportDTO } from "../types";

interface ReportSummaryCardsProps {
  report: ClickReportDTO;
  startDateStr: string;
  endDateStr: string;
}

export function ReportSummaryCards({ report, startDateStr, endDateStr }: ReportSummaryCardsProps) {
  const pagesWithClicks = report.by_page.filter((p) => p.clicks > 0).length;
  const linksWithClicks = report.by_link.filter((l) => l.clicks > 0).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng lượt click */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng lượt click
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {report.total_clicks.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Info className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Tổng lượt bấm (không định danh người duy nhất)</span>
          </div>
        </div>

        {/* Card 2: Trang có tương tác */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Trang có click
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {pagesWithClicks}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                / {report.by_page.length} trang
              </span>
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {pagesWithClicks > 0
              ? `Trang dẫn đầu: ${report.by_page[0]?.internal_name || "N/A"}`
              : "Chưa ghi nhận tương tác"}
          </p>
        </div>

        {/* Card 3: Liên kết có tương tác */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Link có click
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {linksWithClicks}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                / {report.by_link.length} liên kết
              </span>
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            {linksWithClicks > 0
              ? `Top link: ${report.by_link[0]?.label || "N/A"}`
              : "Chưa ghi nhận tương tác"}
          </p>
        </div>

        {/* Card 4: Khoảng thời gian */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Khoảng thời gian
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-foreground block">
              {formatDisplayDate(startDateStr)} — {formatDisplayDate(endDateStr)}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Múi giờ Việt Nam ({report.timezone})
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Snapshot: {formatVietnamDateTime(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
}
