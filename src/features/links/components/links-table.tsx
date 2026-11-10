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
  MoreHorizontal,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { LinkItem } from "@/features/links/types";
import { toggleLinkStatusAction, archiveLinkAction } from "@/features/links/actions";
import { TablePagination } from "@/components/admin/table-pagination";
import { TableActionMenu } from "@/components/admin/table-action-menu";

const LinkFormModal = dynamic(
  () => import("./link-form-modal").then((m) => m.LinkFormModal),
  { ssr: false }
);

interface LinksTableProps {
  initialLinks: LinkItem[];
}

export function LinksTable({ initialLinks }: LinksTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLink, setSelectedLink] = useState<LinkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, startTransition] = useTransition();

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

  const paginatedLinks = filteredLinks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
      await toggleLinkStatusAction(link.id, link.isActive, link.lockVersion);
    });
  };

  const handleArchive = (link: LinkItem) => {
    if (
      link.usageCount > 0 &&
      !confirm(
        `Liên kết này đang được dùng trên ${link.usageCount} trang. Bạn có chắc chắn muốn lưu trữ (ngừng sử dụng)?`
      )
    ) {
      return;
    }

    if (confirm(`Bạn có chắc muốn lưu trữ liên kết "${link.defaultLabel}"?`)) {
      startTransition(async () => {
        await archiveLinkAction(link.id, link.lockVersion);
      });
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "tel":
        return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case "mailto":
        return <Mail className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm liên kết theo tên, URL..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bật (Active)</option>
            <option value="inactive">Đang tắt (Inactive)</option>
          </select>
        </div>

        {/* Create Button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Tổng số: <strong className="font-mono text-foreground">{filteredLinks.length}</strong> liên kết
          </span>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm liên kết mới</span>
          </button>
        </div>
      </div>

      {/* Links List */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs">
        {filteredLinks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Globe className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-semibold">Chưa có liên kết nào</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {search
                ? "Không tìm thấy liên kết nào khớp với từ khóa tìm kiếm."
                : "Bắt đầu bằng cách tạo liên kết đầu tiên để sử dụng trên các trang hồ sơ."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[280px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5 sm:px-4 rounded-tl-2xl">Tên hiển thị & URL</th>
                  <th className="py-2.5 px-3">Loại</th>
                  <th className="py-2.5 px-3">Trang sử dụng</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3.5 sm:px-4 text-right rounded-tr-2xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedLinks.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Name & URL */}
                    <td className="py-2.5 px-3.5 sm:px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground block">
                          {item.defaultLabel}
                        </span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-blue-600 inline-flex items-center gap-1 truncate max-w-xs sm:max-w-sm"
                        >
                          <span className="truncate">{item.targetUrl}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </td>

                    {/* Kind */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-[11px] font-medium capitalize">
                        {getKindIcon(item.kind)}
                        <span>{item.kind}</span>
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          item.usageCount > 0
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title={
                          item.usageCount > 0
                            ? `Đang dùng trên: ${item.affectedPages?.map((p) => p.internalName).join(", ")}`
                            : "Chưa gắn vào trang nào"
                        }
                      >
                        <Layers className="w-3 h-3" />
                        <span>{item.usageCount} trang</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          item.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                        title="Bấm để bật/tắt kích hoạt liên kết"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`}
                        />
                        <span>{item.isActive ? "Đang bật" : "Đã tắt"}</span>
                      </button>
                    </td>

                    {/* Thao tác */}
                    <td className="py-2 px-3.5 sm:px-4 text-right whitespace-nowrap">
                      <TableActionMenu title="Thao tác liên kết" widthClass="w-48" buttonClassName="p-1.5">
                        {(close) => (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                close();
                                handleEdit(item);
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Chỉnh sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                close();
                                handleToggle(item);
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer text-left"
                            >
                              <Power className={`w-3.5 h-3.5 shrink-0 ${item.isActive ? "text-amber-500" : "text-emerald-500"}`} />
                              <span>{item.isActive ? "Tắt hoạt động" : "Bật hoạt động"}</span>
                            </button>

                            <a
                              href={item.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={close}
                              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-muted font-medium text-foreground transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>Mở liên kết</span>
                            </a>

                            <div className="my-1 border-t border-border/50" />

                            <button
                              type="button"
                              onClick={() => {
                                close();
                                handleArchive(item);
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-destructive/10 text-destructive font-medium transition-colors cursor-pointer text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Lưu trữ (Xóa)</span>
                            </button>
                          </>
                        )}
                      </TableActionMenu>
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
    </div>
  );
}
