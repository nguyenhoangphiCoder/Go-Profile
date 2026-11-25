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
  FileText,
  Smartphone,
  LayoutTemplate,
} from "lucide-react";
import type { PageKind, PageListItem } from "../types";
import { duplicatePageAction, archivePageAction } from "../actions";
import { TablePagination } from "@/components/admin/table-pagination";
import { TableActionMenu } from "@/components/admin/table-action-menu";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

const RenameSlugModal = dynamic(
  () => import("./rename-slug-modal").then((m) => m.RenameSlugModal),
  { ssr: false }
);

interface PagesTableProps {
  /** false với người xem (viewer): ẩn các thao tác sửa — server cũng chặn. */
  canEdit?: boolean;
  initialPages: PageListItem[];
}

type PendingAction =
  { type: "duplicate"; page: PageListItem } | { type: "archive"; page: PageListItem } | null;

export function PagesTable({ initialPages, canEdit = true }: PagesTableProps) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | PageKind>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPageForSlug, setSelectedPageForSlug] = useState<PageListItem | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const profileCount = initialPages.filter((p) => p.pageKind !== "landing").length;
  const landingCount = initialPages.filter((p) => p.pageKind === "landing").length;

  const filteredPages = initialPages.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.internalName.toLowerCase().includes(q) ||
      p.primarySlug.toLowerCase().includes(q) ||
      p.aliases.some((a) => a.toLowerCase().includes(q));
    const matchesKind = kindFilter === "all" || p.pageKind === kindFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && p.status === "published") ||
      (statusFilter === "draft" && p.status !== "published");
    return matchesSearch && matchesKind && matchesStatus;
  });

  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const executePendingAction = () => {
    if (!pendingAction) return;
    const action = pendingAction;
    startTransition(async () => {
      if (action.type === "duplicate") {
        const res = await duplicatePageAction(action.page.id);
        setPendingAction(null);
        if (res.success) {
          toast.success(`Đã nhân bản trang "${action.page.internalName}"`);
        } else {
          toast.error(res.error || "Không thể nhân bản trang");
        }
      } else {
        const res = await archivePageAction(action.page.id);
        setPendingAction(null);
        if (res.success) {
          toast.success(`Đã lưu trữ trang "${action.page.internalName}"`);
        } else {
          toast.error(res.error || "Không thể lưu trữ trang");
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Unified Card: Filter Toolbar + Table + Pagination */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        {/* Single Clean Integrated Toolbar */}
        <div className="p-3.5 sm:px-5 border-b border-border/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-muted/20">
          {/* Left: Kind Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { key: "all", label: "Tất cả", count: initialPages.length, Icon: null },
                {
                  key: "landing",
                  label: "Landing Page",
                  count: landingCount,
                  Icon: LayoutTemplate,
                },
                { key: "profile", label: "Profile", count: profileCount, Icon: Smartphone },
              ] as const
            ).map(({ key, label, count, Icon }) => {
              const active = kindFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setKindFilter(key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] tabular-nums ${
                      active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search + Status Segmented Control */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm tên trang, /slug..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-ring/20 focus:border-foreground/40 transition-all"
              />
            </div>

            <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/60 self-start sm:self-auto shrink-0">
              {(
                [
                  ["all", "Tất cả"],
                  ["published", "Xuất bản"],
                  ["draft", "Nháp"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === val
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clean 5-Column Table */}
        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-5">Trang &amp; Đường dẫn</th>
                <th className="py-2.5 px-3 whitespace-nowrap hidden md:table-cell">Loại</th>
                <th className="py-2.5 px-3 whitespace-nowrap hidden sm:table-cell">Trạng thái</th>
                <th className="py-2.5 px-3 whitespace-nowrap hidden lg:table-cell">Cập nhật</th>
                <th className="py-2.5 px-5 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium text-foreground">
                        Không tìm thấy trang nào
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc phía trên.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPages.map((page) => (
                  <tr key={page.id} className="group hover:bg-muted/30 transition-colors">
                    {/* 1. Trang & Slug */}
                    <td className="py-3 px-5">
                      <div className="flex flex-col gap-0.5 min-w-0 max-w-[calc(100vw-9rem)] sm:max-w-md lg:max-w-lg">
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {page.internalName}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            /{page.primarySlug}
                          </span>
                          {page.aliases.length > 0 && (
                            <span
                              className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded tabular-nums"
                              title={`Aliases: ${page.aliases.join(", ")}`}
                            >
                              +{page.aliases.length} alias
                            </span>
                          )}
                          <StatusBadge
                            tone={page.status === "published" ? "success" : "warning"}
                            className="sm:hidden text-[10px] px-1.5 py-0"
                          >
                            {page.status === "published" ? "Xuất bản" : "Nháp"}
                          </StatusBadge>
                        </div>
                      </div>
                    </td>

                    {/* 2. Loại (căn thẳng hàng, không nhảy vị trí theo độ dài tiêu đề) */}
                    <td className="py-3 px-3 whitespace-nowrap hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          page.pageKind === "landing"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {page.pageKind === "landing" ? (
                          <LayoutTemplate className="w-3 h-3" />
                        ) : (
                          <Smartphone className="w-3 h-3" />
                        )}
                        <span>{page.pageKind === "landing" ? "Landing" : "Profile"}</span>
                      </span>
                    </td>

                    {/* 3. Trạng thái + Phiên bản gọn gàng */}
                    <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={page.status === "published" ? "success" : "warning"}>
                          {page.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                        </StatusBadge>
                        {page.hasDraft && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium"
                            title="Trang có thay đổi bản nháp chưa xuất bản"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Có nháp</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Cập nhật */}
                    <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground hidden lg:table-cell tabular-nums">
                      <span>{new Date(page.updatedAt).toLocaleDateString("vi-VN")}</span>
                      {page.publishedRevisionNo ? (
                        <span className="ml-2 text-[11px] text-muted-foreground/70">
                          v{page.publishedRevisionNo}
                        </span>
                      ) : null}
                    </td>

                    {/* 5. Thao tác nhanh (Sửa / Xem + Menu mở rộng) */}
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        {canEdit && (
                          <Link
                            href={`/admin/pages/${page.id}`}
                            className="hidden sm:inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                            title="Chỉnh sửa nội dung"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Sửa</span>
                          </Link>
                        )}

                        {page.status === "published" && (
                          <a
                            href={`/${page.primarySlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title={`Mở /${page.primarySlug}`}
                            aria-label="Xem trang công khai"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {canEdit && (
                          <TableActionMenu title="Thao tác khác">
                            {(close) => (
                              <>
                                <Link
                                  href={`/admin/pages/${page.id}`}
                                  onClick={close}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span>Chỉnh sửa nội dung</span>
                                </Link>

                                {page.status === "published" && (
                                  <a
                                    href={`/${page.primarySlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={close}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span>Xem trang công khai</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPageForSlug(page);
                                    close();
                                  }}
                                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                                >
                                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span>Đổi đường dẫn (Slug)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingAction({ type: "duplicate", page });
                                    close();
                                  }}
                                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                                >
                                  <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span>Nhân bản trang</span>
                                </button>

                                <div className="my-1 border-t border-border/60" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingAction({ type: "archive", page });
                                    close();
                                  }}
                                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-500/10 font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer text-left"
                                >
                                  <Archive className="w-4 h-4 shrink-0" />
                                  <span>Lưu trữ trang</span>
                                </button>
                              </>
                            )}
                          </TableActionMenu>
                        )}
                      </div>
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

      {/* Confirm Dialog (thay window.confirm) */}
      <ConfirmDialog
        open={pendingAction !== null}
        variant={pendingAction?.type === "archive" ? "danger" : "default"}
        title={pendingAction?.type === "archive" ? "Lưu trữ trang?" : "Nhân bản trang?"}
        description={
          pendingAction?.type === "archive"
            ? `Trang "${pendingAction.page.internalName}" sẽ ngừng hiển thị công khai và được ẩn khỏi danh sách.`
            : pendingAction
              ? `Tạo một bản sao nháp mới từ trang "${pendingAction.page.internalName}" để bạn tuỳ chỉnh riêng.`
              : ""
        }
        confirmLabel={pendingAction?.type === "archive" ? "Lưu trữ" : "Nhân bản"}
        loading={isPending}
        onConfirm={executePendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
