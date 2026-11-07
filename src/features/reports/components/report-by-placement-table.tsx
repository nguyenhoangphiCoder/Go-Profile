import { ExternalLink, Layers } from "lucide-react";
import type { ClickByPlacementItem } from "../types";

interface ReportByPlacementTableProps {
  data: ClickByPlacementItem[];
  totalClicks: number;
}

export function ReportByPlacementTable({ data, totalClicks }: ReportByPlacementTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Không có dữ liệu vị trí liên kết nào trong khoảng thời gian này.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
            <th className="py-3 px-4">Trang hồ sơ</th>
            <th className="py-3 px-4 text-center">Vị trí</th>
            <th className="py-3 px-4">Nhãn hiển thị</th>
            <th className="py-3 px-4">URL đích</th>
            <th className="py-3 px-4 text-right">Lượt click</th>
            <th className="py-3 px-4 text-right w-36">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-xs">
          {data.map((item, idx) => {
            const percentage =
              totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(1) : "0.0";

            return (
              <tr
                key={`${item.page_link_id}-${item.position ?? idx}`}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{item.page_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                    {item.position !== null ? `#${item.position + 1}` : "—"}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-foreground">{item.label}</td>
                <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-muted-foreground">
                  <a
                    href={item.target_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    <span className="truncate">{item.target_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </td>
                <td className="py-3 px-4 text-right font-bold text-foreground">
                  {item.clicks.toLocaleString("vi-VN")}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
