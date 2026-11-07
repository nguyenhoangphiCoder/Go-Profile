import { ExternalLink, Link2, Phone, Mail } from "lucide-react";
import type { ClickByLinkItem } from "../types";

interface ReportByLinkTableProps {
  data: ClickByLinkItem[];
  totalClicks: number;
}

export function ReportByLinkTable({ data, totalClicks }: ReportByLinkTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Không có dữ liệu liên kết nào trong khoảng thời gian này.
      </div>
    );
  }

  function renderKindIcon(kind: string) {
    if (kind === "phone") return <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    if (kind === "email") return <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    return <Link2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
            <th className="py-3 px-4">Tên hiển thị</th>
            <th className="py-3 px-4">Địa chỉ đích</th>
            <th className="py-3 px-4 text-center">Phân loại</th>
            <th className="py-3 px-4 text-right">Lượt click</th>
            <th className="py-3 px-4 text-right w-36">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-xs">
          {data.map((item) => {
            const percentage =
              totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(1) : "0.0";

            return (
              <tr key={item.link_id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {renderKindIcon(item.kind)}
                    <span>{item.label}</span>
                  </div>
                </td>
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
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium uppercase bg-muted text-muted-foreground">
                    {item.kind}
                  </span>
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
