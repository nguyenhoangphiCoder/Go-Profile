"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Layers, RotateCcw, Search } from "lucide-react";
import type { ClickByPlacementItem } from "../types";
import { TablePagination } from "@/components/admin/table-pagination";
import { Select } from "@/components/ui/select";

interface ReportByPlacementTableProps {
  data: ClickByPlacementItem[];
  totalClicks: number;
}

export function ReportByPlacementTable({ data, totalClicks }: ReportByPlacementTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [labelSearch, setLabelSearch] = useState("");

  const pageOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of data) {
      if (!map.has(item.page_id)) {
        map.set(item.page_id, item.page_name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [data]);

  const labelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of data) {
      if (selectedPageId && item.page_id !== selectedPageId) continue;
      if (item.label) set.add(item.label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [data, selectedPageId]);

  const filteredData = useMemo(() => {
    const q = labelSearch.trim().toLowerCase();
    return data.filter((item) => {
      if (selectedPageId && item.page_id !== selectedPageId) return false;
      if (selectedLabel && item.label !== selectedLabel) return false;
      if (q && !item.label.toLowerCase().includes(q) && !item.page_name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data, selectedPageId, selectedLabel, labelSearch]);

  const hasActiveFilter = Boolean(selectedPageId || selectedLabel || labelSearch.trim());
  const filteredClicks = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.clicks, 0),
    [filteredData]
  );

  const handlePageChange = (value: string) => {
    setSelectedPageId(value);
    setSelectedLabel("");
    setCurrentPage(1);
  };

  const handleLabelChange = (value: string) => {
    setSelectedLabel(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setLabelSearch(value);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSelectedPageId("");
    setSelectedLabel("");
    setLabelSearch("");
    setCurrentPage(1);
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Không có dữ liệu vị trí liên kết nào trong khoảng thời gian này.
      </div>
    );
  }

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {/* Bộ lọc theo kênh & nhãn hiển thị */}
      <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
        <Select
          size="sm"
          ariaLabel="Lọc theo kênh"
          value={selectedPageId}
          onChange={handlePageChange}
          options={[
            { value: "", label: `Tất cả kênh (${pageOptions.length})` },
            ...pageOptions.map((p) => ({ value: p.id, label: p.name })),
          ]}
          className="sm:min-w-48"
        />

        <Select
          size="sm"
          ariaLabel="Lọc theo nhãn hiển thị"
          value={selectedLabel}
          onChange={handleLabelChange}
          options={[
            { value: "", label: `Tất cả nhãn hiển thị (${labelOptions.length})` },
            ...labelOptions.map((label) => ({ value: label, label })),
          ]}
          className="sm:min-w-52"
        />

        <div className="relative flex-1 min-w-44">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={labelSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo nhãn hiển thị hoặc kênh..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {hasActiveFilter && (
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {filteredData.length} vị trí •{" "}
              <strong className="text-foreground font-mono">
                {filteredClicks.toLocaleString("vi-VN")}
              </strong>{" "}
              click
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              title="Xóa bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa lọc</span>
            </button>
          </div>
        )}
      </div>

      {filteredData.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Không tìm thấy vị trí liên kết nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                  <th className="py-2.5 px-3.5 sm:px-4 hidden md:table-cell">Trang hồ sơ</th>
                  <th className="py-2.5 px-3.5 sm:px-4 text-center">Vị trí</th>
                  <th className="py-2.5 px-3.5 sm:px-4">Nhãn hiển thị</th>
                  <th className="py-2.5 px-3.5 sm:px-4 hidden md:table-cell">URL đích</th>
                  <th className="py-2.5 px-3.5 sm:px-4 text-right">Lượt click</th>
                  <th className="py-2.5 px-3.5 sm:px-4 text-right w-40 hidden sm:table-cell">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs">
                {paginatedData.map((item, idx) => {
                  const percentage =
                    totalClicks > 0 ? ((item.clicks / totalClicks) * 100).toFixed(1) : "0.0";

                  return (
                    <tr
                      key={`${item.page_link_id}-${item.position ?? idx}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 sm:px-4 font-medium text-foreground hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                          <span className="font-semibold">{item.page_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 sm:px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-muted/60 text-muted-foreground border border-border/60">
                          {item.position !== null ? `#${item.position + 1}` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 sm:px-4 font-semibold text-foreground">
                        {item.label}
                        <span className="md:hidden block text-[11px] font-normal text-muted-foreground">
                          {item.page_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 sm:px-4 max-w-xs truncate font-mono text-[11px] text-muted-foreground hidden md:table-cell">
                        <a
                          href={item.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                        >
                          <span className="truncate">{item.target_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3.5 sm:px-4 text-right font-mono tabular-nums font-bold text-foreground">
                        {item.clicks.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3.5 sm:px-4 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono tabular-nums font-medium text-muted-foreground w-11 text-right">
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

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="vị trí"
          />
        </>
      )}
    </div>
  );
}
