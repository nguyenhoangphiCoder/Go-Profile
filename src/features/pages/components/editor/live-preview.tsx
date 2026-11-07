"use client";

import Image from "next/image";
import { resolveTheme } from "@/config/themes";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import type {
  EditorBlockItem,
  PageThemeConfig,
  HeaderBlockPayload,
  HeadingBlockPayload,
  TextBlockPayload,
  ImageBlockPayload,
  LinkListBlockPayload,
  SpacerBlockPayload,
  DividerBlockPayload,
} from "../../types";
import { Link2, Phone, Share2 } from "lucide-react";

interface LivePreviewProps {
  themeConfig: PageThemeConfig;
  title: string;
  blocks: EditorBlockItem[];
  previewMode: "mobile" | "desktop";
}

export function LivePreview({ themeConfig, title, blocks, previewMode }: LivePreviewProps) {
  const currentTheme = resolveTheme(themeConfig);
  const accentColor = currentTheme.accentColor || "#2563eb";

  const pillRadiusClass =
    currentTheme.borderRadius === "sm"
      ? "rounded-xl"
      : currentTheme.borderRadius === "md"
        ? "rounded-2xl"
        : currentTheme.borderRadius === "none"
          ? "rounded-none"
          : "rounded-[31px]";

  const visibleBlocks = blocks.filter((b) => b.isVisible).sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col items-center justify-center h-full p-2 sm:p-4">
      {/* Device frame container */}
      <div
        className={`transition-all duration-300 overflow-hidden shadow-xl border ${
          previewMode === "mobile"
            ? "w-[360px] sm:w-[380px] h-[720px] rounded-[48px] border-blue-200 bg-white p-3 ring-8 ring-blue-100/70"
            : "w-full max-w-2xl h-[720px] rounded-3xl border-border bg-white"
        }`}
      >
        {/* Device screen */}
        <div
          className="w-full h-full overflow-y-auto rounded-[36px] p-6 relative flex flex-col transition-colors duration-200 border border-slate-200/60"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}14 0%, transparent 65%)`,
            color: currentTheme.textColor,
            fontFamily:
              currentTheme.fontFamily === "be-vietnam-pro"
                ? "var(--font-be-vietnam-pro), sans-serif"
                : "var(--font-inter), sans-serif",
            letterSpacing: "0.5px",
          }}
        >
          {/* Status bar notch simulation in mobile mode */}
          {previewMode === "mobile" && (
            <div className="w-28 h-4 bg-slate-200 rounded-full mx-auto mb-4 shrink-0" />
          )}

          {/* Page Content */}
          <div className="space-y-4 flex-1">
            {visibleBlocks.length === 0 ? (
              <div className="text-center py-16 opacity-40 text-xs">
                Chưa có khối nội dung nào. Thêm khối ở cột bên trái để bắt đầu.
              </div>
            ) : (
              visibleBlocks.map((block) => {
                switch (block.type) {
                  case "header": {
                    const p = block.payload as HeaderBlockPayload;
                    return (
                      <div key={block.id} className="text-center">
                        {p.avatarUrl && (
                          <div
                            className="relative w-24 h-24 mx-auto rounded-full overflow-hidden block"
                            style={{
                              boxShadow: `0 1px 2px ${accentColor}20, 0 2px 4px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.08), 0 8px 16px rgba(15, 23, 42, 0.08)`,
                            }}
                          >
                            <Image
                              src={p.avatarUrl}
                              alt={p.title || title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <h1 className="mt-2.5 text-sm sm:text-base font-bold uppercase tracking-[1px]">
                          {p.title || title || "Tên hồ sơ"}
                        </h1>
                        {p.bio && (
                          <div className="mt-3 space-y-2 text-center mx-auto">
                            {renderLnkBioFormattedText(p.bio, "center", accentColor)}
                          </div>
                        )}
                      </div>
                    );
                  }

                  case "heading": {
                    const p = block.payload as HeadingBlockPayload;
                    const level = p.level || 1;
                    return (
                      <div key={block.id} className="pt-2 text-center">
                        {level === 1 ? (
                          <h2 className="text-base font-medium uppercase tracking-[1px] text-center">
                            {p.text || "Tiêu đề mục"}
                          </h2>
                        ) : level === 2 ? (
                          <h3 className="text-sm font-bold uppercase tracking-[1px] text-center">
                            {p.text || "Tiêu đề mục"}
                          </h3>
                        ) : (
                          <h4 className="text-xs font-semibold uppercase tracking-[1px] text-center opacity-75">
                            {p.text || "Tiêu đề mục"}
                          </h4>
                        )}
                      </div>
                    );
                  }

                  case "text": {
                    const p = block.payload as TextBlockPayload;
                    const align = p.align || "center";
                    return (
                      <div key={block.id} className="pt-1 space-y-1.5">
                        {p.content
                          ? renderLnkBioFormattedText(p.content, align, accentColor)
                          : "Nội dung văn bản giới thiệu..."}
                      </div>
                    );
                  }

                  case "image": {
                    const p = block.payload as ImageBlockPayload;
                    return (
                      <div key={block.id} className="space-y-1.5 overflow-hidden">
                        {p.imageUrl ? (
                          <div className="relative w-full aspect-16/9 overflow-hidden rounded-2xl border border-blue-100">
                            <Image
                              src={p.imageUrl}
                              alt={p.alt || "Banner ảnh"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-16/9 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-center text-xs opacity-60">
                            Chưa chọn ảnh
                          </div>
                        )}
                        {p.caption && (
                          <p className="text-[11px] opacity-60 text-center">{p.caption}</p>
                        )}
                      </div>
                    );
                  }

                  case "link_list": {
                    const placements = block.placements || [];
                    const p = block.payload as LinkListBlockPayload;
                    const isGrid = p.layout === "grid";

                    return (
                      <div
                        key={block.id}
                        className={isGrid ? "grid grid-cols-2 gap-2.5 pt-1" : "space-y-2.5 pt-1"}
                      >
                        {placements.map((pl) => {
                          const iconUrl = pl.mediaOverrideUrl || pl.defaultMediaUrl;
                          const label = pl.labelOverride || pl.defaultLabel;
                          const isContact = pl.defaultKind === "contact";
                          const hasLeftIcon = Boolean(iconUrl) || isContact;

                          return (
                            <div
                              key={pl.id}
                              className={`relative min-h-[58px] w-full flex items-center justify-center p-2 border-2 transition-transform hover:scale-[1.01] ${pillRadiusClass}`}
                              style={{
                                backgroundColor: currentTheme.cardBackground,
                                color: currentTheme.cardTextColor,
                                borderColor:
                                  currentTheme.cardBorderColor || currentTheme.cardBackground,
                              }}
                            >
                              {iconUrl ? (
                                <div className="w-[44px] h-[44px] rounded-full overflow-hidden absolute left-[7px] top-1/2 -translate-y-1/2 bg-white shrink-0 shadow-xs">
                                  <Image
                                    src={iconUrl}
                                    alt={label}
                                    fill
                                    className="object-cover rounded-full"
                                    unoptimized
                                  />
                                </div>
                              ) : isContact ? (
                                <div className="w-[44px] h-[44px] rounded-full absolute left-[7px] top-1/2 -translate-y-1/2 bg-white/15 flex items-center justify-center shrink-0">
                                  <Phone className="w-4 h-4" />
                                </div>
                              ) : null}
                              <span
                                className={`block w-full text-center font-bold uppercase text-xs tracking-[1px] leading-snug wrap-break-word ${
                                  hasLeftIcon ? "px-14" : "px-4"
                                }`}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  case "social_icons": {
                    const placements = block.placements || [];
                    return (
                      <div
                        key={block.id}
                        className="flex items-center justify-center gap-3 py-2 flex-wrap"
                      >
                        {placements.map((pl) => {
                          const iconUrl = pl.mediaOverrideUrl || pl.defaultMediaUrl;
                          const label = pl.labelOverride || pl.defaultLabel;

                          return (
                            <div
                              key={pl.id}
                              className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: currentTheme.cardBackground,
                                color: currentTheme.cardTextColor,
                                borderColor: currentTheme.cardBorderColor || "transparent",
                              }}
                              title={label}
                            >
                              {iconUrl ? (
                                <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                  <Image
                                    src={iconUrl}
                                    alt={label}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <Share2 className="w-4 h-4 opacity-80" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  case "spacer": {
                    const p = block.payload as SpacerBlockPayload;
                    const h =
                      p.height === "xl"
                        ? "h-16"
                        : p.height === "lg"
                          ? "h-10"
                          : p.height === "md"
                            ? "h-6"
                            : "h-3";
                    return <div key={block.id} className={h} />;
                  }

                  case "divider": {
                    const p = block.payload as DividerBlockPayload;
                    const style = p.style || "solid";
                    return (
                      <div key={block.id} className="py-2">
                        <hr
                          className={`border-t opacity-20 border-${style}`}
                          style={{ borderColor: currentTheme.textColor }}
                        />
                      </div>
                    );
                  }

                  default:
                    return null;
                }
              })
            )}
          </div>

          {/* Footer branding */}
          <div className="pt-8 pb-2 text-center">
            <div className="inline-flex items-center justify-center gap-1.5 opacity-80">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-md text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Link2 className="w-3 h-3" />
              </span>
              <span
                className="font-bold text-[11px] tracking-[1px]"
                style={{ color: currentTheme.textColor }}
              >
                Gờ Cafe
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
