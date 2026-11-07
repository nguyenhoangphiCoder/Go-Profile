"use client";

import Image from "next/image";
import { THEME_PRESETS } from "@/config/themes";
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
import { ExternalLink, Phone, Share2 } from "lucide-react";

interface LivePreviewProps {
  themeConfig: PageThemeConfig;
  title: string;
  blocks: EditorBlockItem[];
  previewMode: "mobile" | "desktop";
}

export function LivePreview({ themeConfig, title, blocks, previewMode }: LivePreviewProps) {
  const currentTheme = THEME_PRESETS[themeConfig.preset] || THEME_PRESETS["go-original"];

  const radiusClass =
    currentTheme.borderRadius === "full"
      ? "rounded-3xl"
      : currentTheme.borderRadius === "sm"
        ? "rounded-md"
        : currentTheme.borderRadius === "none"
          ? "rounded-none"
          : "rounded-xl";

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
          className="w-full h-full overflow-y-auto rounded-[36px] sm:rounded-[36px] p-6 relative flex flex-col transition-colors duration-200 border border-slate-200/60"
          style={{
            backgroundColor: currentTheme.backgroundColor,
            color: currentTheme.textColor,
            fontFamily:
              currentTheme.fontFamily === "be-vietnam-pro"
                ? "var(--font-be-vietnam-pro), sans-serif"
                : "var(--font-inter), sans-serif",
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
                      <div key={block.id} className="text-center space-y-3 pb-2">
                        {p.avatarUrl && (
                          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-blue-500/20 shadow-md">
                            <Image
                              src={p.avatarUrl}
                              alt={p.title || title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <h1 className="text-lg font-black tracking-tight">
                            {p.title || title || "Tên hồ sơ"}
                          </h1>
                          {p.bio && (
                            <p className="text-xs opacity-80 mt-1 whitespace-pre-wrap max-w-xs mx-auto">
                              {p.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  case "heading": {
                    const p = block.payload as HeadingBlockPayload;
                    const level = p.level || 2;
                    return (
                      <div key={block.id} className="pt-2">
                        {level === 1 ? (
                          <h2 className="text-base font-black tracking-tight text-center">
                            {p.text || "Tiêu đề mục"}
                          </h2>
                        ) : level === 2 ? (
                          <h3 className="text-sm font-bold tracking-tight text-center">
                            {p.text || "Tiêu đề mục"}
                          </h3>
                        ) : (
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-center opacity-70">
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
                      <div
                        key={block.id}
                        className={`text-xs opacity-80 leading-relaxed whitespace-pre-wrap text-${align}`}
                      >
                        {p.content || "Nội dung văn bản giới thiệu..."}
                      </div>
                    );
                  }

                  case "image": {
                    const p = block.payload as ImageBlockPayload;
                    return (
                      <div key={block.id} className="space-y-1.5 overflow-hidden">
                        {p.imageUrl ? (
                          <div
                            className={`relative w-full aspect-16/9 overflow-hidden ${radiusClass}`}
                          >
                            <Image
                              src={p.imageUrl}
                              alt={p.alt || "Banner ảnh"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-full aspect-16/9 bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-xs opacity-60 ${radiusClass}`}
                          >
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
                        className={isGrid ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}
                      >
                        {placements.map((pl) => {
                          const iconUrl = pl.mediaOverrideUrl || pl.defaultMediaUrl;
                          const label = pl.labelOverride || pl.defaultLabel;

                          return (
                            <div
                              key={pl.id}
                              className={`flex items-center gap-3 p-3.5 transition-transform hover:scale-[1.01] active:scale-[0.99] border ${radiusClass}`}
                              style={{
                                backgroundColor: currentTheme.cardBackground,
                                color: currentTheme.cardTextColor,
                                borderColor: currentTheme.cardBorderColor || "transparent",
                              }}
                            >
                              {iconUrl ? (
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                  <Image
                                    src={iconUrl}
                                    alt={label}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : pl.defaultKind === "contact" ? (
                                <Phone className="w-5 h-5 shrink-0 opacity-80" />
                              ) : (
                                <ExternalLink className="w-5 h-5 shrink-0 opacity-80" />
                              )}
                              <span className="text-xs sm:text-sm font-semibold truncate flex-1 text-center">
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
                              className="w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-110"
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
          <div className="pt-8 pb-2 text-center opacity-40 text-[10px]">
            <span>Gờ Cafe Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
