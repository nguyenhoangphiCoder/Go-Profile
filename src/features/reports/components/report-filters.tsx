"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Filter, RotateCcw } from "lucide-react";
import type { DatePresetKey, ReportFilterOptions } from "../types";

interface ReportFiltersProps {
  currentPreset: DatePresetKey;
  currentFromDate: string;
  currentToDate: string;
  currentPageId?: string;
  currentLinkId?: string;
  options: ReportFilterOptions;
}

const PRESET_OPTIONS: Array<{ key: DatePresetKey; label: string }> = [
  { key: "today", label: "Hôm nay" },
  { key: "last7days", label: "7 ngày qua" },
  { key: "last30days", label: "30 ngày qua" },
  { key: "thisMonth", label: "Tháng này" },
  { key: "custom", label: "Tùy chỉnh" },
];

export function ReportFilters({
  currentPreset,
  currentFromDate,
  currentToDate,
  currentPageId,
  currentLinkId,
  options,
}: ReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [preset, setPreset] = useState<DatePresetKey>(currentPreset);
  const [fromDate, setFromDate] = useState<string>(currentFromDate);
  const [toDate, setToDate] = useState<string>(currentToDate);
  const [pageId, setPageId] = useState<string>(currentPageId || "");
  const [linkId, setLinkId] = useState<string>(currentLinkId || "");

  function handlePresetChange(newPreset: DatePresetKey) {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      // Tự động reload với preset mới
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("preset", newPreset);
      params.delete("from");
      params.delete("to");
      if (pageId) params.set("pageId", pageId);
      if (linkId) params.set("linkId", linkId);

      startTransition(() => {
        router.push(`/admin/reports?${params.toString()}`);
      });
    }
  }

  function handleApplyFilters(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    params.set("preset", preset);

    if (preset === "custom") {
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
    }

    if (pageId) params.set("pageId", pageId);
    if (linkId) params.set("linkId", linkId);

    startTransition(() => {
      router.push(`/admin/reports?${params.toString()}`);
    });
  }

  function handleResetFilters() {
    setPreset("last7days");
    setPageId("");
    setLinkId("");
    startTransition(() => {
      router.push("/admin/reports?preset=last7days");
    });
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Hàng 1: Preset chọn nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5" />
          <span>Khoảng thời gian:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handlePresetChange(item.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                preset === item.key
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hàng 2: Bộ lọc chi tiết */}
      <form
        onSubmit={handleApplyFilters}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        {/* Tùy chỉnh ngày nếu preset là custom */}
        {preset === "custom" && (
          <>
            <div>
              <label
                htmlFor="filter-from-date"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Từ ngày (Việt Nam)
              </label>
              <input
                id="filter-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate || undefined}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label
                htmlFor="filter-to-date"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Đến ngày (Việt Nam)
              </label>
              <input
                id="filter-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </>
        )}

        {/* Lọc theo trang */}
        <div className={preset === "custom" ? "" : "md:col-span-2"}>
          <label
            htmlFor="filter-page-select"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Lọc theo trang hồ sơ
          </label>
          <select
            id="filter-page-select"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-foreground"
          >
            <option value="">Tất cả các trang</option>
            {options.pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.internalName} {p.slug ? `(/${p.slug})` : ""} {p.isArchived ? "[Đã lưu trữ]" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc theo link */}
        <div className={preset === "custom" ? "" : "md:col-span-1"}>
          <label
            htmlFor="filter-link-select"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Lọc theo liên kết
          </label>
          <select
            id="filter-link-select"
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-foreground"
          >
            <option value="">Tất cả các liên kết</option>
            {options.links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} ({l.targetUrl.slice(0, 30)}...)
              </option>
            ))}
          </select>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isPending ? "Đang tải..." : "Áp dụng"}</span>
          </button>

          {(preset !== "last7days" || pageId || linkId) && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc mặc định"
              className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
