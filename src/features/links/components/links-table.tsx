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
import type { LinkItem } from "@/features/links/types";
import { LinkFormModal } from "./link-form-modal";
import { toggleLinkStatusAction, archiveLinkAction } from "@/features/links/actions";

interface LinksTableProps {
  initialLinks: LinkItem[];
}

export function LinksTable({ initialLinks }: LinksTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm liên kết theo tên, URL..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bật (Active)</option>
            <option value="inactive">Đang tắt (Inactive)</option>
          </select>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm liên kết mới</span>
        </button>
      </div>

      {/* Links List */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Tên hiển thị & URL</th>
                  <th className="py-3 px-4">Loại</th>
                  <th className="py-3 px-4">Trang sử dụng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLinks.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    {/* Name & URL */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground block">
                          {item.defaultLabel}
                        </span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 truncate max-w-sm"
                        >
                          <span className="truncate">{item.targetUrl}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </td>

                    {/* Kind */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-[11px] font-medium capitalize">
                        {getKindIcon(item.kind)}
                        <span>{item.kind}</span>
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.usageCount > 0
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
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
                    <td className="py-3.5 px-4 whitespace-nowrap">
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

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Chỉnh sửa liên kết"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(item)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title={item.isActive ? "Tắt liên kết" : "Bật liên kết"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchive(item)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Lưu trữ liên kết"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
