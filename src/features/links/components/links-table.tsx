"use client";

import { useState, useTransition } from "react";
import {
  Globe,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Power,
  ExternalLink,
  Layers,
  Search,
  Plus,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { LinkItem } from "@/features/links/types";
import { toggleLinkStatusAction, archiveLinkAction } from "@/features/links/actions";
import { TablePagination } from "@/components/admin/table-pagination";
import { TableActionMenu } from "@/components/admin/table-action-menu";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

const LinkFormModal = dynamic(() => import("./link-form-modal").then((m) => m.LinkFormModal), {
  ssr: false,
});

interface LinksTableProps {
  initialLinks: LinkItem[];
  /** false với người xem (viewer): ẩn các thao tác sửa — server cũng chặn. */
  canEdit?: boolean;
}

export function LinksTable({ initialLinks, canEdit = true }: LinksTableProps) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLink, setSelectedLink] = useState<LinkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkToArchive, setLinkToArchive] = useState<LinkItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredLinks = initialLinks.filter((l) => {
    const matchesSearch =
      l.defaultLabel.toLowerCase().includes(search.toLowerCase()) ||
      l.targetUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && l.isActive) ||
      (statusFilter === "inactive" && !l.isActive);
    return matchesSearch && matchesStatus;
  });

  const paginatedLinks = filteredLinks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleEdit = (link: LinkItem) => {
    setSelectedLink(link);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedLink(null);
    setIsModalOpen(true);
  };

  const handleToggle = (link: LinkItem) => {
    startTransition(async () => {
      const res = await toggleLinkStatusAction(link.id, link.isActive, link.lockVersion);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          link.isActive
            ? `Đã tắt liên kết "${link.defaultLabel}"`
            : `Đã bật liên kết "${link.defaultLabel}"`
        );
      }
    });
  };

  const confirmArchive = () => {
    if (!linkToArchive) return;
    const target = linkToArchive;
    startTransition(async () => {
      const res = await archiveLinkAction(target.id, target.lockVersion);
      setLinkToArchive(null);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Đã lưu trữ liên kết "${target.defaultLabel}"`);
      }
    });
  };

  const getKindBadge = (kind: string) => {
    switch (kind) {
      case "tel":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-muted/60 text-xs font-medium text-foreground">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Hotline</span>
          </span>
        );
      case "mailto":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-muted/60 text-xs font-medium text-foreground">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Email</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-muted/60 text-xs font-medium text-foreground">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Website</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm tên liên kết hoặc URL..."
              className="w-full h-9 pl-9 pr-3.5 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring/20 focus:border-foreground/40 transition-all"
            />
          </div>

          <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/60 self-start sm:self-auto">
            {(
              [
                ["all", "Tất cả"],
                ["active", "Đang bật"],
                ["inactive", "Đã tắt"],
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

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            <strong className="font-semibold text-foreground">{filteredLinks.length}</strong> liên
            kết
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 shadow-2xs transition-opacity cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm liên kết</span>
            </button>
          )}
        </div>
      </div>

      {/* Links Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        {filteredLinks.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <Globe className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">Chưa có liên kết nào</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {search
                ? "Không tìm thấy liên kết nào khớp với từ khóa tìm kiếm."
                : "Bắt đầu bằng cách tạo liên kết đầu tiên để dùng chung trên các trang hồ sơ."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground font-semibold text-xs">
                <tr>
                  <th className="py-3 px-4">Tên hiển thị & URL</th>
                  <th className="py-3 px-3 hidden md:table-cell">Loại</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Đang dùng</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Trạng thái</th>
                  <th className="py-3 px-4 text-right w-14">
                    <span className="sr-only sm:not-sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedLinks.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/35 transition-colors">
                    {/* Name & URL */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 min-w-0 max-w-[calc(100vw-9.5rem)] sm:max-w-sm">
                        <span className="font-semibold text-foreground block break-words">
                          {item.defaultLabel}
                        </span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 max-w-full"
                        >
                          <span className="truncate">{item.targetUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        <div className="sm:hidden mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(item)}
                            disabled={!canEdit}
                            className="cursor-pointer"
                            title="Bấm để bật/tắt liên kết"
                          >
                            <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                              {item.isActive ? "Đang bật" : "Đã tắt"}
                            </StatusBadge>
                          </button>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {item.usageCount} trang
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Kind */}
                    <td className="py-3.5 px-3 whitespace-nowrap hidden md:table-cell">
                      {getKindBadge(item.kind)}
                    </td>

                    {/* Usage */}
                    <td className="py-3.5 px-3 whitespace-nowrap hidden lg:table-cell">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-foreground tabular-nums"
                        title={
                          item.usageCount > 0
                            ? `Đang dùng trên: ${item.affectedPages?.map((p) => p.internalName).join(", ")}`
                            : "Chưa gắn vào trang nào"
                        }
                      >
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.usageCount} trang</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={!canEdit}
                        className="cursor-pointer disabled:cursor-default"
                        title="Bấm để bật/tắt kích hoạt liên kết"
                      >
                        <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                          {item.isActive ? "Đang bật" : "Đã tắt"}
                        </StatusBadge>
                      </button>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canEdit && (
                        <TableActionMenu title="Thao tác liên kết" widthClass="w-48">
                          {(close) => (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  close();
                                  handleEdit(item);
                                }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span>Chỉnh sửa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  close();
                                  handleToggle(item);
                                }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                              >
                                <Power
                                  className={`w-3.5 h-3.5 shrink-0 ${item.isActive ? "text-amber-500" : "text-emerald-500"}`}
                                />
                                <span>{item.isActive ? "Tắt hoạt động" : "Bật hoạt động"}</span>
                              </button>

                              <a
                                href={item.targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={close}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span>Mở liên kết</span>
                              </a>

                              <div className="my-1 border-t border-border/60" />

                              <button
                                type="button"
                                onClick={() => {
                                  close();
                                  setLinkToArchive(item);
                                }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium transition-colors cursor-pointer text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Lưu trữ (Xóa)</span>
                              </button>
                            </>
                          )}
                        </TableActionMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalItems={filteredLinks.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="liên kết"
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <LinkFormModal
          key={selectedLink?.id || "new"}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          link={selectedLink}
        />
      )}

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        open={linkToArchive !== null}
        variant="danger"
        title="Lưu trữ liên kết?"
        description={
          linkToArchive
            ? linkToArchive.usageCount > 0
              ? `Liên kết "${linkToArchive.defaultLabel}" hiện đang được dùng trên ${linkToArchive.usageCount} trang. Bạn có chắc muốn lưu trữ và ngừng sử dụng?`
              : `Bạn có chắc muốn lưu trữ liên kết "${linkToArchive.defaultLabel}"?`
            : ""
        }
        confirmLabel="Lưu trữ"
        loading={isPending}
        onConfirm={confirmArchive}
        onCancel={() => setLinkToArchive(null)}
      />
    </div>
  );
}
