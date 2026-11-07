"use client";

import { BarChart3 } from "lucide-react";
import { formatDisplayDate } from "../timezone";
import type { ClickByDateItem } from "../types";

interface ReportChartProps {
  data: ClickByDateItem[];
  totalClicks: number;
}

export function ReportChart({ data, totalClicks }: ReportChartProps) {
  if (!data || data.length === 0 || totalClicks === 0) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div className="max-w-sm mx-auto">
          <p className="text-sm font-semibold text-foreground">
            Chưa có dữ liệu click trong khoảng này
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Không có lượt click nào được ghi nhận cho bộ lọc đã chọn. Hãy thử nới rộng khoảng thời
            gian hoặc chọn tất cả trang.
          </p>
        </div>
      </div>
    );
  }

  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Biểu đồ lượt click theo thời gian</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phân bố lượt bấm theo ngày (Múi giờ Asia/Ho_Chi_Minh)
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
          Đỉnh: {maxClicks.toLocaleString("vi-VN")} click/ngày
        </span>
      </div>

      {/* Vùng biểu đồ cột */}
      <div className="pt-6 pb-2">
        <div className="h-48 flex items-end gap-2 md:gap-3 overflow-x-auto pb-4">
          {data.map((item) => {
            const heightPercent = maxClicks > 0 ? Math.round((item.clicks / maxClicks) * 100) : 0;
            const isZero = item.clicks === 0;

            return (
              <div
                key={item.date}
                className="flex-1 min-w-[32px] flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip khi hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-md border border-border pointer-events-none whitespace-nowrap z-20">
                  <span className="text-amber-500 font-bold">{item.clicks}</span> click (
                  {formatDisplayDate(item.date)})
                </div>

                {/* Số lượng phía trên cột */}
                {!isZero && (
                  <span className="text-[10px] font-semibold text-muted-foreground mb-1 group-hover:text-amber-600 transition-colors">
                    {item.clicks}
                  </span>
                )}

                {/* Cột dữ liệu */}
                <div
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${
                    isZero ? "h-1 bg-muted/40" : "bg-amber-500 group-hover:bg-amber-600 shadow-xs"
                  }`}
                  style={{ height: isZero ? "4px" : `${Math.max(heightPercent, 6)}%` }}
                />

                {/* Nhãn ngày bên dưới */}
                <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                  {item.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
