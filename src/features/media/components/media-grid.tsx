"use client";

import { useState, useTransition } from "react";
import { Plus, Copy, Trash2, Check, Lock, Image as ImageIcon, Search } from "lucide-react";
import dynamic from "next/dynamic";
import type { MediaAssetItem } from "@/features/media/types";
import { deleteMediaAction } from "@/features/media/actions";
import { TablePagination } from "@/components/admin/table-pagination";

const MediaUploadModal = dynamic(
  () => import("./media-upload-modal").then((m) => m.MediaUploadModal),
  { ssr: false }
);

interface MediaGridProps {
  initialAssets: MediaAssetItem[];
}

export function MediaGrid({ initialAssets }: MediaGridProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filteredAssets = initialAssets.filter((a) =>
    (a.originalFilename || a.objectPath).toLowerCase().includes(search.toLowerCase())
  );

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCopyUrl = (asset: MediaAssetItem) => {
    if (asset.publicUrl) {
      navigator.clipboard.writeText(asset.publicUrl);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = (asset: MediaAssetItem) => {
    if (asset.isReferenced) {
      alert(
        "Không thể xóa hình ảnh này vì đang được sử dụng bởi các trang hoặc danh mục liên kết."
      );
      return;
    }

    if (
      confirm(
        `Bạn có chắc chắn muốn xóa hình ảnh "${asset.originalFilename || "này"}" khỏi hệ thống?`
      )
    ) {
      startTransition(async () => {
        const res = await deleteMediaAction(asset.id);
        if (!res.success && res.error) {
          alert(res.error);
        }
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm hình ảnh theo tên..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tải ảnh mới</span>
        </button>
      </div>

      {/* Grid */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center border border-border rounded-2xl bg-card space-y-3">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold">Chưa có hình ảnh nào</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {search
              ? "Không tìm thấy hình ảnh khớp với từ khóa tìm kiếm."
              : "Tải lên logo, banner hoặc icon để trang trí cho các trang hồ sơ."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {paginatedAssets.map((asset) => (
              <div
                key={asset.id}
                className="group rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col hover:border-primary/50 transition-colors shadow-2xs"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-square bg-muted/20 overflow-hidden flex items-center justify-center p-2">
                {asset.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.publicUrl}
                    alt={asset.originalFilename || "Media"}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {asset.isReferenced ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-medium shadow-xs"
                      title="Đang được sử dụng trên trang hoặc liên kết"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Đang dùng</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2 border-t border-border/60">
                <div className="min-w-0">
                  <span
                    className="text-xs font-semibold block truncate"
                    title={asset.originalFilename || asset.objectPath}
                  >
                    {asset.originalFilename || "Tệp không tên"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {formatFileSize(asset.sizeBytes)} • {asset.mimeType?.split("/")[1] || "img"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <button
                    onClick={() => handleCopyUrl(asset)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Sao chép URL CDN"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(asset)}
                    disabled={asset.isReferenced}
                    className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title={
                      asset.isReferenced
                        ? "Không thể xóa ảnh đang được sử dụng"
                        : "Xóa ảnh khỏi kho lưu trữ"
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredAssets.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="hình ảnh"
            className="border-t-0"
          />
        </div>
      </div>
    )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <MediaUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      )}
    </div>
  );
}
