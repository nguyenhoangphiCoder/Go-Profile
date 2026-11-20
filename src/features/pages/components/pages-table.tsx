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
  FileText,
} from "lucide-react";
import type { PageListItem } from "../types";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPageForSlug, setSelectedPageForSlug] = useState<PageListItem | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPages = initialPages.filter((p) => {
    const matchesSearch =
      p.internalName.toLowerCase().includes(search.toLowerCase()) ||
      p.primarySlug.toLowerCase().includes(search.toLowerCase()) ||
      p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && p.status === "published") ||
      (statusFilter === "draft" && p.status !== "published");
    return matchesSearch && matchesStatus;
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm tên trang, đường dẫn..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-3.5 text-[13px] rounded-lg border border-border bg-card focus:outline-hidden focus:ring-2 focus:ring-ring/20 focus:border-foreground/40 transition-all"
            />
          </div>

          {/* Segmented status filter */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/60 self-start sm:self-auto">
            {(
              [
                ["all", "Tất cả"],
                ["published", "Đã xuất bản"],
                ["draft", "Bản nháp"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                className={`h-8 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
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

        <span className="text-xs text-muted-foreground tabular-nums self-end sm:self-center">
          <strong className="font-semibold text-foreground">{filteredPages.length}</strong> trang
        </span>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4">Trang & Đường dẫn</th>
                <th className="py-3 px-3 hidden sm:table-cell">Trạng thái</th>
                <th className="py-3 px-3 hidden md:table-cell">Phiên bản</th>
                <th className="py-3 px-3 text-center hidden md:table-cell">Số link</th>
                <th className="py-3 px-3 hidden lg:table-cell">Cập nhật</th>
                <th className="py-3 px-4 text-right w-14">
                  <span className="sr-only sm:not-sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium text-foreground">
                        Không tìm thấy trang hồ sơ nào
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc trạng thái.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/35 transition-colors">
                    {/* Trang & Slug */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 min-w-0 max-w-[calc(100vw-9.5rem)] sm:max-w-xs">
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="font-semibold text-foreground hover:underline truncate"
                        >
                          {page.internalName}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md break-all">
                            /{page.primarySlug}
                          </span>
                          <StatusBadge
                            tone={page.status === "published" ? "success" : "warning"}
                            className="sm:hidden text-[11px] px-2 py-0"
                          >
                            {page.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                          </StatusBadge>
                          {page.aliases.length > 0 && (
                            <span
                              className="text-[11px] text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded-md tabular-nums"
                              title={`Aliases: ${page.aliases.join(", ")}`}
                            >
                              +{page.aliases.length} alias
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3 whitespace-nowrap hidden sm:table-cell">
                      <StatusBadge tone={page.status === "published" ? "success" : "warning"}>
                        {page.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                      </StatusBadge>
                    </td>

                    {/* Phiên bản */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-muted-foreground hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {page.publishedRevisionNo ? (
                          <span className="font-medium text-foreground text-xs tabular-nums">
                            Phiên bản #{page.publishedRevisionNo}
                          </span>
                        ) : (
                          <span className="text-xs">Chưa phát hành</span>
                        )}
                        {page.hasDraft && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 font-medium">
                            <FileEdit className="w-3 h-3" />
                            Có bản nháp mới
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Số link */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-center hidden md:table-cell">
                      <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-medium text-foreground tabular-nums">
                        {page.linksCount}
                      </span>
                    </td>

                    {/* Cập nhật */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs text-muted-foreground hidden lg:table-cell tabular-nums">
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        <span>{new Date(page.updatedAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canEdit && (
                        <TableActionMenu title="Thao tác trang">
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
        title={pendingAction?.type === "archive" ? "Lưu trữ trang hồ sơ?" : "Nhân bản trang hồ sơ?"}
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
