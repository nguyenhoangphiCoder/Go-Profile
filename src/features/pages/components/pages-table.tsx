"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
} from "lucide-react";
import type { PageListItem } from "../types";
import { RenameSlugModal } from "./rename-slug-modal";
import { duplicatePageAction, archivePageAction } from "../actions";

interface PagesTableProps {
  initialPages: PageListItem[];
}

export function PagesTable({ initialPages }: PagesTableProps) {
  const [search, setSearch] = useState("");
  const [selectedPageForSlug, setSelectedPageForSlug] = useState<PageListItem | null>(null);
  const [, startTransition] = useTransition();

  const filteredPages = initialPages.filter(
    (p) =>
      p.internalName.toLowerCase().includes(search.toLowerCase()) ||
      p.primarySlug.toLowerCase().includes(search.toLowerCase()) ||
      p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()))
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-end sm:self-center">
          <Layers className="w-3.5 h-3.5" />
          <span>Tổng số: {filteredPages.length} trang</span>
        </div>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Trang & Slug</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Phiên bản</th>
                <th className="py-3.5 px-4">Số link</th>
                <th className="py-3.5 px-4">Cập nhật</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-30" />
                      <p>Không tìm thấy trang hồ sơ nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                    {/* Trang & Slug */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex flex-col gap-1 max-w-[280px] sm:max-w-xs">
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {page.internalName}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            /{page.primarySlug}
                          </span>
                          {page.aliases.length > 0 && (
                            <span
                              className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md"
                              title={`Aliases: ${page.aliases.join(", ")}`}
                            >
                              +{page.aliases.length} alias
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {page.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đã xuất bản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Bản nháp / Ẩn
                        </span>
                      )}
                    </td>

                    {/* Phiên bản */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {page.publishedRevisionNo ? (
                          <span className="font-medium text-foreground">
                            Rev #{page.publishedRevisionNo}
                          </span>
                        ) : (
                          <span>Chưa có bản phát hành</span>
                        )}
                        {page.hasDraft && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <FileEdit className="w-3 h-3" />
                            Đang có bản nháp mới
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Số link */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs font-semibold">
                      {page.linksCount} link
                    </td>

                    {/* Cập nhật */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(page.updatedAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Chỉnh sửa nội dung & giao diện"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        {page.status === "published" && (
                          <a
                            href={`/${page.primarySlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Xem trang công khai"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedPageForSlug(page)}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Đổi đường dẫn chính (Slug)"
                        >
                          <Globe className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(page)}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Nhân bản trang"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleArchive(page)}
                          className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          title="Lưu trữ trang"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
