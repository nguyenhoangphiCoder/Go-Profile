"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search,
  ExternalLink,
  Edit3,
  Copy,
  Archive,
  Globe,
  FileEdit,
  Clock,
  Layers,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import type { PageListItem } from "../types";
import { duplicatePageAction, archivePageAction } from "../actions";
import { TablePagination } from "@/components/admin/table-pagination";
import { TableActionMenu } from "@/components/admin/table-action-menu";

const RenameSlugModal = dynamic(
  () => import("./rename-slug-modal").then((m) => m.RenameSlugModal),
  { ssr: false }
);

interface PagesTableProps {
  initialPages: PageListItem[];
}

export function PagesTable({ initialPages }: PagesTableProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPageForSlug, setSelectedPageForSlug] = useState<PageListItem | null>(null);
  const [, startTransition] = useTransition();

  const filteredPages = initialPages.filter(
    (p) =>
      p.internalName.toLowerCase().includes(search.toLowerCase()) ||
      p.primarySlug.toLowerCase().includes(search.toLowerCase()) ||
      p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDuplicate = (page: PageListItem) => {
    if (confirm(`Bạn có chắc muốn nhân bản trang "${page.internalName}"?`)) {
      startTransition(async () => {
        const res = await duplicatePageAction(page.id);
        if (!res.success && res.error) {
          alert(res.error);
        }
      });
    }
  };

  const handleArchive = (page: PageListItem) => {
    if (
      confirm(
        `Lưu trữ trang "${page.internalName}"? Trang sẽ ngừng hiển thị công khai và được ẩn khỏi danh sách.`
      )
    ) {
      startTransition(async () => {
        const res = await archivePageAction(page.id);
        if (!res.success && res.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên trang, slug chính hoặc alias..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-end sm:self-center">
          <Layers className="w-3.5 h-3.5" />
          <span>Tổng số: {filteredPages.length} trang</span>
        </div>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs">
        <div className="overflow-x-auto min-h-[280px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-2.5 px-3.5 sm:px-4 rounded-tl-2xl">Trang & Đường dẫn</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Phiên bản</th>
                <th className="py-2.5 px-3 text-center">Số link</th>
                <th className="py-2.5 px-3">Cập nhật</th>
                <th className="py-2.5 px-3.5 sm:px-4 text-right rounded-tr-2xl">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-30" />
                      <p>Không tìm thấy trang hồ sơ nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPages.map((page) => (
                  <tr
                    key={page.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Trang & Slug */}
                    <td className="py-2.5 px-3.5 sm:px-4">
                      <div className="flex flex-col gap-0.5 max-w-[280px] sm:max-w-xs">
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 text-xs"
                        >
                          {page.internalName}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                            /{page.primarySlug}
                          </span>
                          {page.aliases.length > 0 && (
                            <span
                              className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded"
                              title={`Aliases: ${page.aliases.join(", ")}`}
                            >
                              +{page.aliases.length} alias
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {page.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đã xuất bản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Bản nháp
                        </span>
                      )}
                    </td>

                    {/* Phiên bản */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {page.publishedRevisionNo ? (
                          <span className="font-semibold text-foreground text-[11px]">
                            Rev #{page.publishedRevisionNo}
                          </span>
                        ) : (
                          <span className="text-[11px]">Chưa phát hành</span>
                        )}
                        {page.hasDraft && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                            <FileEdit className="w-3 h-3" />
                            Có bản nháp
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Số link */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center font-mono text-xs font-semibold text-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded-md text-[11px]">
                        {page.linksCount}
                      </span>
                    </td>

                    {/* Cập nhật */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{new Date(page.updatedAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-2.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                      <TableActionMenu title="Thao tác trang">
                        {(close) => (
                          <>
                            <Link
                              href={`/admin/pages/${page.id}`}
                              onClick={close}
                              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Chỉnh sửa nội dung</span>
                            </Link>

                            {page.status === "published" && (
                              <a
                                href={`/${page.primarySlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={close}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Xem trang công khai</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPageForSlug(page);
                                close();
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                            >
                              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>Đổi đường dẫn (Slug)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleDuplicate(page);
                                close();
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                            >
                              <Copy className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span>Nhân bản trang</span>
                            </button>

                            <div className="my-1 border-t border-border/50" />

                            <button
                              type="button"
                              onClick={() => {
                                handleArchive(page);
                                close();
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-red-500/10 font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer text-left"
                            >
                              <Archive className="w-4 h-4 text-red-500 shrink-0" />
                              <span>Lưu trữ trang</span>
                            </button>
                          </>
                        )}
                      </TableActionMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={filteredPages.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="trang"
        />
      </div>

      {/* Rename Slug Modal */}
      {selectedPageForSlug && (
        <RenameSlugModal
          isOpen={true}
          onClose={() => setSelectedPageForSlug(null)}
          pageId={selectedPageForSlug.id}
          currentSlug={selectedPageForSlug.primarySlug}
          expectedPageVersion={selectedPageForSlug.lockVersion}
          aliases={selectedPageForSlug.aliases}
        />
      )}
    </div>
  );
}
