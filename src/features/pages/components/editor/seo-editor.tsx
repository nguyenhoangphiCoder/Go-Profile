"use client";

import Image from "next/image";
import type { PageSeoConfig } from "../../types";

interface SeoEditorProps {
  seo: PageSeoConfig;
  onChange: (seo: PageSeoConfig) => void;
  availableMedia: { id: string; originalFilename: string | null; publicUrl: string | null }[];
}

export function SeoEditor({ seo, onChange, availableMedia }: SeoEditorProps) {
  const selectedMedia = availableMedia.find((m) => m.id === seo.ogImageMediaId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold">Cài đặt SEO & Mạng xã hội</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tối ưu hóa hiển thị khi tìm kiếm trên Google và khi chia sẻ liên kết lên Facebook, Zalo
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Tiêu đề SEO (Meta Title)
          </label>
          <input
            type="text"
            placeholder="Mặc định lấy theo tiêu đề trang"
            value={seo.metaTitle || ""}
            onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <span className="text-[11px] text-muted-foreground block mt-1">
            Độ dài kiến nghị: 50-60 ký tự. Hiện tại: {(seo.metaTitle || "").length} ký tự.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Mô tả SEO (Meta Description)
          </label>
          <textarea
            rows={3}
            placeholder="Tóm tắt ngắn gọn nội dung trang khi hiển thị trên công cụ tìm kiếm..."
            value={seo.metaDescription || ""}
            onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <span className="text-[11px] text-muted-foreground block mt-1">
            Độ dài kiến nghị: 120-160 ký tự. Hiện tại: {(seo.metaDescription || "").length} ký tự.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Ảnh chia sẻ xem trước (OG Image)
          </label>
          <div className="flex items-center gap-4">
            <select
              value={seo.ogImageMediaId || ""}
              onChange={(e) => {
                const mediaId = e.target.value || undefined;
                const m = availableMedia.find((item) => item.id === mediaId);
                onChange({
                  ...seo,
                  ogImageMediaId: mediaId,
                  ogImageUrl: m?.publicUrl || undefined,
                });
              }}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">-- Sử dụng ảnh mặc định của hệ thống --</option>
              {availableMedia.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.originalFilename || m.id}
                </option>
              ))}
            </select>

            {selectedMedia?.publicUrl && (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0">
                <Image
                  src={selectedMedia.publicUrl}
                  alt="OG Image Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
