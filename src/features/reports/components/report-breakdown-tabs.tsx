"use client";

import { useState } from "react";
import type { ClickReportDTO } from "../types";
import { ReportComparisonMatrix } from "./report-comparison-matrix";
import { ReportByPageTable } from "./report-by-page-table";
import { ReportByLinkTable } from "./report-by-link-table";
import { ReportByPlacementTable } from "./report-by-placement-table";

interface ReportBreakdownTabsProps {
  report: ClickReportDTO;
  startDateStr: string;
  endDateStr: string;
}

type BreakdownTab = "matrix" | "pages" | "links" | "placements";

export function ReportBreakdownTabs({
  report,
  startDateStr,
  endDateStr,
}: ReportBreakdownTabsProps) {
  const [activeTab, setActiveTab] = useState<BreakdownTab>("matrix");

  const tabs: { id: BreakdownTab; label: string; count?: number }[] = [
    { id: "matrix", label: "Ma trận so sánh" },
    { id: "pages", label: "Theo trang", count: report.by_page.length },
    { id: "links", label: "Theo liên kết", count: report.by_link.length },
    { id: "placements", label: "Theo vị trí", count: report.by_placement.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Phân tích chi tiết</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chuyển đổi giữa các góc nhìn để so sánh hiệu suất từng trang, liên kết và vị trí đặt.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Góc nhìn báo cáo chi tiết"
          className="inline-flex flex-wrap items-center p-1 rounded-xl border border-border bg-muted/60 self-start sm:self-auto"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selected
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[11px] tabular-nums opacity-70">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "matrix" && (
        <ReportComparisonMatrix
          pages={report.by_page}
          links={report.by_link}
          placements={report.by_placement}
          startDateStr={startDateStr}
          endDateStr={endDateStr}
        />
      )}

      {activeTab === "pages" && (
        <div className="bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden">
          <ReportByPageTable data={report.by_page} totalClicks={report.total_clicks} />
        </div>
      )}

      {activeTab === "links" && (
        <div className="bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden">
          <ReportByLinkTable data={report.by_link} totalClicks={report.total_clicks} />
        </div>
      )}

      {activeTab === "placements" && (
        <div className="bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden">
          <ReportByPlacementTable data={report.by_placement} totalClicks={report.total_clicks} />
        </div>
      )}
    </div>
  );
}
