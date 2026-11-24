import Link from "next/link";
import { Inbox, ArrowRight, CheckCircle2, PhoneCall, Sparkles } from "lucide-react";
import type { LeadsReportSummary } from "@/features/leads/queries";

export function LeadsReportSection({ summary }: { summary: LeadsReportSummary }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-600" />
            <span>Hiệu quả chuyển đổi Landing Page (Leads)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thống kê khách hàng gửi form trong khoảng thời gian đã chọn.
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold shrink-0"
        >
          <span>Quản lý &amp; Xuất Excel</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-background space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">
            Tổng Leads
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">{summary.total}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-background space-y-1">
          <div className="text-[11px] font-semibold text-blue-600 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Mới / Chờ gọi
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {summary.byStatus.new}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-background space-y-1">
          <div className="text-[11px] font-semibold text-amber-600 uppercase flex items-center gap-1">
            <PhoneCall className="w-3 h-3" /> Đã liên hệ
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {summary.byStatus.contacted}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã chốt ({summary.conversionRatePct}%)
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {summary.byStatus.converted}
          </div>
        </div>
      </div>

      {/* Breakdown by Page & by Form */}
      {summary.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Theo Trang nguồn
            </div>
            <div className="divide-y divide-border/60 text-xs">
              {summary.byPage.map((p, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{p.pageName}</div>
                    {p.pageSlug && (
                      <div className="text-[11px] font-mono text-muted-foreground">
                        /{p.pageSlug}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="font-bold text-foreground">{p.total}</span>
                    <span className="text-[11px] text-emerald-600 ml-2">({p.converted} chốt)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Theo Tên Form
            </div>
            <div className="divide-y divide-border/60 text-xs">
              {summary.byForm.map((f, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground truncate">{f.formName}</span>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="font-bold text-foreground">{f.total}</span>
                    <span className="text-[11px] text-emerald-600 ml-2">({f.converted} chốt)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
