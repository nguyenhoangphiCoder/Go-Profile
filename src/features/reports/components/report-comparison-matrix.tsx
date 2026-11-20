"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search, Table2 } from "lucide-react";
import type { ClickByLinkItem, ClickByPageItem, ClickByPlacementItem } from "../types";
import { TablePagination } from "@/components/admin/table-pagination";

type GroupMode = "label" | "link";
type SortDirection = "desc" | "asc";

interface MatrixRow {
  key: string;
  label: string;
  sublabel?: string;
  countsByPage: Record<string, number>;
  total: number;
}

interface ReportComparisonMatrixProps {
  pages: ClickByPageItem[];
  links: ClickByLinkItem[];
  placements: ClickByPlacementItem[];
  startDateStr: string;
  endDateStr: string;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ReportComparisonMatrix({
  pages,
  links,
  placements,
  startDateStr,
  endDateStr,
}: ReportComparisonMatrixProps) {
  const [groupMode, setGroupMode] = useState<GroupMode>("label");
  const [includeZeroLinks, setIncludeZeroLinks] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("total"); // "total" | page_id
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const activePageIds = useMemo(() => new Set(pages.map((p) => p.page_id)), [pages]);
  const linkById = useMemo(() => new Map(links.map((l) => [l.link_id, l])), [links]);

  const rows = useMemo<MatrixRow[]>(() => {
    const map = new Map<string, MatrixRow>();

    if (groupMode === "label") {
      for (const pl of placements) {
        if (!activePageIds.has(pl.page_id)) continue;
        const displayLabel = (pl.label || "Liên kết").trim();
        const key = displayLabel.toLowerCase();
        let row = map.get(key);
        if (!row) {
          row = { key, label: displayLabel, countsByPage: {}, total: 0 };
          map.set(key, row);
        }
        row.countsByPage[pl.page_id] = (row.countsByPage[pl.page_id] || 0) + pl.clicks;
        row.total += pl.clicks;
      }
    } else {
      if (includeZeroLinks) {
        for (const l of links) {
          map.set(l.link_id, {
            key: l.link_id,
            label: l.label,
            sublabel: l.target_url,
            countsByPage: {},
            total: 0,
          });
        }
      }
      for (const pl of placements) {
        if (!activePageIds.has(pl.page_id)) continue;
        const link = linkById.get(pl.link_id);
        let row = map.get(pl.link_id);
        if (!row) {
          row = {
            key: pl.link_id,
            label: link?.label || pl.label || "Liên kết",
            sublabel: link?.target_url || pl.target_url,
            countsByPage: {},
            total: 0,
          };
          map.set(pl.link_id, row);
        }
        row.countsByPage[pl.page_id] = (row.countsByPage[pl.page_id] || 0) + pl.clicks;
        row.total += pl.clicks;
      }
    }

    return Array.from(map.values());
  }, [groupMode, includeZeroLinks, placements, links, activePageIds, linkById]);

  const filteredAndSortedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.label.toLowerCase().includes(q) ||
            (r.sublabel && r.sublabel.toLowerCase().includes(q))
        )
      : rows;

    return [...filtered].sort((a, b) => {
      const valA = sortBy === "total" ? a.total : (a.countsByPage[sortBy] ?? 0);
      const valB = sortBy === "total" ? b.total : (b.countsByPage[sortBy] ?? 0);
      if (valA !== valB) {
        return sortDir === "desc" ? valB - valA : valA - valB;
      }
      if (a.total !== b.total) return b.total - a.total;
      return a.label.localeCompare(b.label, "vi");
    });
  }, [rows, search, sortBy, sortDir]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let grandTotal = 0;
    for (const row of filteredAndSortedRows) {
      grandTotal += row.total;
      for (const p of pages) {
        totals[p.page_id] = (totals[p.page_id] || 0) + (row.countsByPage[p.page_id] || 0);
      }
    }
    return { totals, grandTotal };
  }, [filteredAndSortedRows, pages]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(columnKey);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    const headerLabel = groupMode === "label" ? "Nhãn hiển thị" : "Liên kết gốc";
    const headers = [headerLabel, ...pages.map((p) => p.internal_name), "Tổng"];
    const csvLines = [
      headers.map(escapeCsvCell).join(","),
      ...filteredAndSortedRows.map((row) =>
        [row.label, ...pages.map((p) => row.countsByPage[p.page_id] || 0), row.total]
          .map(escapeCsvCell)
          .join(",")
      ),
      [
        "Tổng cộng",
        ...pages.map((p) => columnTotals.totals[p.page_id] || 0),
        columnTotals.grandTotal,
      ]
        .map(escapeCsvCell)
        .join(","),
    ];

    const blob = new Blob(["\uFEFF" + csvLines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-so-sanh-${startDateStr}_${endDateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 shrink-0" />;
    }
    return sortDir === "desc" ? (
      <ArrowDown className="w-3 h-3 text-blue-600 shrink-0" />
    ) : (
      <ArrowUp className="w-3 h-3 text-blue-600 shrink-0" />
    );
  };

  const paginatedRows = filteredAndSortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Table2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Bảng so sánh lượt click theo Nhãn &amp; Kênh
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hàng là nhãn hiển thị (hoặc liên kết gốc), cột là các trang hồ sơ đang hoạt động.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle chế độ gom hàng */}
          <div className="inline-flex rounded-xl bg-muted/60 p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setGroupMode("label");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                groupMode === "label"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nhãn hiển thị
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupMode("link");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                groupMode === "link"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Liên kết gốc
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredAndSortedRows.length === 0 || pages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Tải bảng so sánh dưới dạng file CSV (mở được bằng Excel)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Toolbar tìm kiếm & tùy chọn */}
      <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              groupMode === "label"
                ? "Tìm theo nhãn hiển thị..."
                : "Tìm theo tên liên kết hoặc URL..."
            }
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {groupMode === "link" && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeZeroLinks}
                onChange={(e) => {
                  setIncludeZeroLinks(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-border text-blue-600 focus:ring-blue-500/20 cursor-pointer"
              />
              <span>Hiện cả liên kết 0 click</span>
            </label>
          )}
          <span className="font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground whitespace-nowrap">
            {filteredAndSortedRows.length} hàng × {pages.length} kênh
          </span>
        </div>
      </div>

      {/* Bảng ma trận */}
      {pages.length === 0 || filteredAndSortedRows.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          {pages.length === 0
            ? "Chưa có trang hồ sơ nào đang hoạt động để so sánh."
            : "Không có dữ liệu lượt click phù hợp trong khoảng thời gian này."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                  <th className="py-2.5 px-4 sticky left-0 z-10 bg-muted/95 backdrop-blur-xs min-w-52 border-r border-border/60">
                    {groupMode === "label" ? "Nhãn hiển thị" : "Liên kết gốc"}
                  </th>
                  {pages.map((p) => (
                    <th key={p.page_id} className="py-2.5 px-3.5 text-right min-w-36">
                      <button
                        type="button"
                        onClick={() => handleSort(p.page_id)}
                        className="inline-flex items-center justify-end gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                        title={`Sắp xếp theo ${p.internal_name}`}
                      >
                        <span className="truncate max-w-40 normal-case font-semibold text-foreground">
                          {p.internal_name}
                        </span>
                        {renderSortIcon(p.page_id)}
                      </button>
                    </th>
                  ))}
                  <th className="py-2.5 px-4 text-right min-w-24 border-l border-border/60 bg-muted/60">
                    <button
                      type="button"
                      onClick={() => handleSort("total")}
                      className="inline-flex items-center justify-end gap-1 hover:text-foreground transition-colors cursor-pointer ml-auto"
                    >
                      <span>Tổng</span>
                      {renderSortIcon("total")}
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50 text-xs">
                {paginatedRows.map((row) => {
                  const maxVal =
                    pages.length > 1
                      ? Math.max(...pages.map((p) => row.countsByPage[p.page_id] || 0))
                      : 0;

                  return (
                    <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-foreground sticky left-0 z-10 bg-card border-r border-border/60">
                        <div className="truncate max-w-64" title={row.label}>
                          {row.label}
                        </div>
                        {row.sublabel && (
                          <div
                            className="text-[10px] font-mono font-normal text-muted-foreground truncate max-w-64"
                            title={row.sublabel}
                          >
                            {row.sublabel}
                          </div>
                        )}
                      </td>

                      {pages.map((p) => {
                        const count = row.countsByPage[p.page_id] || 0;
                        const isBest = maxVal > 0 && count === maxVal;
                        return (
                          <td
                            key={p.page_id}
                            className={`py-2.5 px-3.5 text-right font-mono tabular-nums ${
                              isBest
                                ? "bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold"
                                : count > 0
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground/40"
                            }`}
                          >
                            {count > 0 ? count.toLocaleString("vi-VN") : "0"}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-foreground border-l border-border/60 bg-muted/20">
                        {row.total.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-border/80 bg-muted/40 font-bold text-xs">
                  <td className="py-2.5 px-4 sticky left-0 z-10 bg-muted/95 border-r border-border/60 text-foreground">
                    Tổng cộng
                  </td>
                  {pages.map((p) => (
                    <td
                      key={p.page_id}
                      className="py-2.5 px-3.5 text-right font-mono tabular-nums text-foreground"
                    >
                      {(columnTotals.totals[p.page_id] || 0).toLocaleString("vi-VN")}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-blue-700 dark:text-blue-400 border-l border-border/60 bg-muted/60">
                    {columnTotals.grandTotal.toLocaleString("vi-VN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredAndSortedRows.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName={groupMode === "label" ? "nhãn" : "liên kết"}
          />
        </>
      )}
    </div>
  );
}
