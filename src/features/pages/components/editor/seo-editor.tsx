"use client";

import Image from "next/image";
import { Globe, Share2, Sparkles } from "lucide-react";
import type { PageSeoConfig } from "../../types";
import { MediaPickerField } from "@/components/admin/media-picker-field";

interface SeoEditorProps {
  seo: PageSeoConfig;
  onChange: (seo: PageSeoConfig) => void;
  availableMedia: { id: string; originalFilename: string | null; publicUrl: string | null }[];
  onMediaAdded?: (newMedia: { id: string; originalFilename: string | null; publicUrl: string | null }) => void;
}

export function SeoEditor({ seo, onChange, availableMedia, onMediaAdded }: SeoEditorProps) {
  const selectedMedia = availableMedia.find((m) => m.id === seo.ogImageMediaId);

  const metaTitle = seo.metaTitle || "";
  const metaDescription = seo.metaDescription || "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground">Cài đặt SEO & Chia sẻ Mạng xã hội</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tối ưu hóa hiển thị khi tìm kiếm trên Google và khi chia sẻ liên kết lên Facebook, Zalo, Telegram.
        </p>
      </div>

      <div className="space-y-4">
        {/* Meta Title */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Tiêu đề SEO (Meta Title)
            </label>
            <span
              className={`text-[11px] font-mono ${
                metaTitle.length > 60
                  ? "text-amber-500 font-bold"
                  : metaTitle.length >= 40
                    ? "text-emerald-500"
                    : "text-muted-foreground"
              }`}
            >
              {metaTitle.length}/60 ký tự
            </span>
          </div>
          <input
            type="text"
            placeholder="Mặc định lấy theo tiêu đề trang..."
            value={metaTitle}
            onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[11px] text-muted-foreground">
            Khuyến nghị từ 50-60 ký tự để không bị cắt bớt trên kết quả tìm kiếm của Google.
          </p>
        </div>

        {/* Meta Description */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Mô tả SEO (Meta Description)
            </label>
            <span
              className={`text-[11px] font-mono ${
                metaDescription.length > 160
                  ? "text-amber-500 font-bold"
                  : metaDescription.length >= 100
                    ? "text-emerald-500"
                    : "text-muted-foreground"
              }`}
            >
              {metaDescription.length}/160 ký tự
            </span>
          </div>
          <textarea
            rows={3}
            placeholder="Tóm tắt ngắn gọn nội dung trang hồ sơ khi hiển thị trên công cụ tìm kiếm và mạng xã hội..."
            value={metaDescription}
            onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[11px] text-muted-foreground">
            Khuyến nghị từ 120-160 ký tự mô tả hấp dẫn để tăng tỷ lệ click (CTR).
          </p>
        </div>

        {/* OG Image */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-2.5">
          <MediaPickerField
            label="Ảnh đại diện khi chia sẻ (OG Image)"
            mediaId={seo.ogImageMediaId}
            mediaUrl={seo.ogImageUrl || selectedMedia?.publicUrl}
            onChange={(mId, mUrl) =>
              onChange({
                ...seo,
                ogImageMediaId: mId || undefined,
                ogImageUrl: mUrl || undefined,
              })
            }
            availableMedia={availableMedia}
            onMediaAdded={onMediaAdded}
            aspectHint="standard"
            helpText="Khuyến nghị: 1200 × 630 px"
          />
          <p className="text-[11px] text-muted-foreground">
            Kích thước chuẩn kiến nghị: 1200 × 630 px (tỷ lệ 1.91:1) để hiển thị sắc nét nhất trên Facebook và Zalo.
          </p>
        </div>
      </div>

      {/* Visual Live Previews */}
      <div className="space-y-4 pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground">Mô phỏng hiển thị thực tế</h4>
        </div>

        {/* Google Search Snippet Simulation */}
        <div className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-slate-900 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">gocafe.me</span>
            <span>›</span>
            <span>profile</span>
          </div>
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
            {metaTitle || "Gờ Cafe - Cà phê chuẩn gu"}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {metaDescription ||
              "Khám phá các liên kết đặt hàng, kênh mạng xã hội và thông tin chính thức của Gờ Cafe."}
          </div>
        </div>

        {/* Social Card Simulation */}
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50 text-[11px] text-muted-foreground">
            <Share2 className="w-3.5 h-3.5" />
            <span>Mô phỏng chia sẻ Facebook / Zalo</span>
          </div>
          {selectedMedia?.publicUrl ? (
            <div className="relative w-full aspect-1.91/1 bg-muted">
              <Image
                src={selectedMedia.publicUrl}
                alt="OG Preview"
                fill
                className="object-cover"
                unoptimized
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full aspect-1.91/1 bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
              Ảnh xem trước mặc định (1200×630)
            </div>
          )}
          <div className="p-3 bg-card border-t border-border/40 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              GOCAFE.ME
            </span>
            <div className="text-xs font-bold text-foreground truncate">
              {metaTitle || "Gờ Cafe - Cà phê chuẩn gu"}
            </div>
            <div className="text-[11px] text-muted-foreground line-clamp-1">
              {metaDescription || "Hệ thống liên kết và thông tin của Gờ Cafe."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
