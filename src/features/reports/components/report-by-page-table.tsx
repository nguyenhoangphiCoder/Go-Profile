import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import type { ClickByPageItem } from "../types";

interface ReportByPageTableProps {
  data: ClickByPageItem[];
  totalClicks: number;
}

export function ReportByPageTable({ data, totalClicks }: ReportByPageTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Không có dữ liệu trang nào trong khoảng thời gian này.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
            <th className="py-3 px-4">Tên trang</th>
            <th className="py-3 px-4">Đường dẫn (Slug)</th>
            <th className="py-3 px-4 text-right">Lượt click</th>
            <th className="py-3 px-4 text-right w-36">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-xs">
          {data.map((item) => {
            const percentage =
              totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(1) : "0.0";

            return (
              <tr key={item.page_id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{item.internal_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                  {item.slug ? (
                    <Link
                      href={`/${item.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <span>/{item.slug}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/60">Chưa có slug</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-bold text-foreground">
                  {item.clicks.toLocaleString("vi-VN")}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
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
