"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { resolveTheme } from "@/config/themes";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import { resolveSmartIcon } from "@/features/public/components/brand-icons";
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
import { CheckCircle2, Sparkles, GripVertical, RotateCcw } from "lucide-react";

interface LivePreviewProps {
  themeConfig: PageThemeConfig;
  title: string;
  blocks: EditorBlockItem[];
  previewMode: "mobile" | "desktop";
  zoomScale?: number;
}

export function LivePreview({
  themeConfig,
  title,
  blocks,
  previewMode,
  zoomScale = 1,
}: LivePreviewProps) {
  const currentTheme = resolveTheme(themeConfig);
  const accentColor = currentTheme.accentColor || "#2563eb";

  const [frameWidth, setFrameWidth] = useState<number>(previewMode === "mobile" ? 375 : 620);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);
  const dragStartXRef = useRef(0);
  const startWidthRef = useRef(frameWidth);

  // Đồng bộ kích thước khi người dùng bấm chuyển đổi Mobile / Desktop ở thanh tiêu đề
  useEffect(() => {
    setFrameWidth(previewMode === "mobile" ? 375 : 620);
  }, [previewMode]);

  const onPointerDownHandle = (e: React.PointerEvent, side: "left" | "right") => {
    e.preventDefault();
    setIsDragging(side);
    dragStartXRef.current = e.clientX;
    startWidthRef.current = frameWidth;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMoveHandle = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const multiplier = isDragging === "right" ? 2 : -2;
    const nextWidth = Math.max(320, Math.min(960, Math.round(startWidthRef.current + deltaX * multiplier)));
    setFrameWidth(nextWidth);
  };

  const onPointerUpHandle = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const isPhoneView = frameWidth <= 460;

  const pillRadiusClass =
    currentTheme.borderRadius === "sm"
      ? "rounded-xl"
      : currentTheme.borderRadius === "md"
        ? "rounded-2xl"
        : currentTheme.borderRadius === "none"
          ? "rounded-none"
          : "rounded-[31px]";

  const visibleBlocks = blocks.filter((b) => b.isVisible).sort((a, b) => a.position - b.position);
  const hasBlurBackground = Boolean(currentTheme.backgroundBlur || currentTheme.backgroundVariant);
  const isGlassmorphism = Boolean(currentTheme.cardBackdropBlur);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-2 sm:p-4 select-none relative">
      {/* DevTools Responsive Controls Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-xs shadow-md z-30 mb-3">
        <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded-md">
          <span>{frameWidth}</span>
          <span className="text-[10px] text-muted-foreground font-normal">px</span>
        </div>

        <div className="h-3 w-px bg-border/80 mx-1" />

        {/* Quick Presets */}
        <button
          type="button"
          onClick={() => setFrameWidth(360)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
            frameWidth === 360
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="360px - Điện thoại nhỏ (Android / Galaxy)"
        >
          360
        </button>
        <button
          type="button"
          onClick={() => setFrameWidth(375)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
            frameWidth === 375
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="375px - iPhone chuẩn (SE / 12/13/14 mini)"
        >
          375
        </button>
        <button
          type="button"
          onClick={() => setFrameWidth(430)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
            frameWidth === 430
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="430px - iPhone Pro Max / Màn hình lớn"
        >
          430
        </button>
        <button
          type="button"
          onClick={() => setFrameWidth(620)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
            frameWidth === 620
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="620px - Phablet / Mini Tablet"
        >
          620
        </button>
        <button
          type="button"
          onClick={() => setFrameWidth(768)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
            frameWidth === 768
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="768px - iPad / Tablet"
        >
          768
        </button>

        <div className="h-3 w-px bg-border/80 mx-1" />

        <button
          type="button"
          onClick={() => setFrameWidth(375)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Đặt lại kích thước mặc định (375px)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Device frame container with zoom scaling and DevTools Drag Handles */}
      <div
        className="transition-transform duration-200 ease-out origin-center flex items-center justify-center relative group"
        style={{ transform: `scale(${zoomScale})` }}
      >
        {/* Left Drag Handle */}
        <div
          onPointerDown={(e) => onPointerDownHandle(e, "left")}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onDoubleClick={() => setFrameWidth(375)}
          className={`absolute -left-6 z-40 flex items-center justify-center w-5 h-24 rounded-full border border-border/80 bg-background/95 hover:bg-primary hover:text-white text-muted-foreground shadow-xl cursor-ew-resize transition-all duration-150 touch-none select-none ${
            isDragging === "left"
              ? "bg-primary text-white scale-110 shadow-primary/30 ring-2 ring-primary/40"
              : "opacity-70 group-hover:opacity-100"
          }`}
          title="Kéo sang ngang để thu nhỏ / phóng to (nhấp đúp để đặt lại 375px)"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Device frame */}
        <div
          className={`transition-all duration-75 overflow-hidden shadow-2xl relative ${
            isPhoneView
              ? "h-[720px] max-h-[calc(100vh-170px)] rounded-[52px] border-[10px] border-slate-900 bg-slate-950 p-2.5 shadow-2xl ring-1 ring-white/10"
              : "h-[720px] max-h-[calc(100vh-170px)] rounded-3xl border-2 border-slate-700/30 bg-slate-900/10 p-3 shadow-2xl"
          }`}
          style={{ width: `${frameWidth}px`, maxWidth: "100%" }}
          suppressHydrationWarning
        >
          {/* While dragging, show floating width badge */}
          {isDragging && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
              {frameWidth} px
            </div>
          )}

          {/* Desktop/Tablet Browser Bar */}
          {!isPhoneView && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 rounded-t-xl mb-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 bg-slate-950/60 rounded-md px-3 py-1 text-center font-mono text-[10px] text-slate-400 truncate">
                https://gocafe.me/{title.toLowerCase().replace(/[^a-z0-9]/g, "") || "profile"} ({frameWidth}px)
              </div>
            </div>
          )}

          {/* Device screen */}
          <div
            className={`w-full h-full overflow-y-auto ${
              isPhoneView ? "rounded-[40px]" : "rounded-xl"
            } p-5 sm:p-6 relative flex flex-col transition-colors duration-200 select-none scrollbar-thin scrollbar-thumb-slate-400/20`}
            suppressHydrationWarning
            style={{
              backgroundColor: currentTheme.backgroundColor,
              backgroundImage: currentTheme.backgroundGradient
                ? currentTheme.backgroundGradient
                : hasBlurBackground
                  ? undefined
                  : `radial-gradient(circle at 50% 0%, ${accentColor}14 0%, transparent 65%)`,
              color: currentTheme.textColor,
              fontFamily:
                currentTheme.fontFamily === "be-vietnam-pro"
                  ? "var(--font-be-vietnam-pro), sans-serif"
                  : "var(--font-inter), sans-serif",
              letterSpacing: "0.5px",
            }}
          >
          {/* Ambient Blurred Background Simulation inside preview frame */}
          {hasBlurBackground && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-[36px] z-0"
              aria-hidden="true"
            >
              {currentTheme.backgroundVariant === "frosted-warm" ? (
                <>
                  <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-600/30 blur-[70px]" />
                  <div className="absolute top-[35%] -left-[10%] w-60 h-60 rounded-full bg-yellow-700/25 blur-[70px]" />
                  <div className="absolute top-[50%] -right-[10%] w-64 h-64 rounded-full bg-amber-500/25 blur-[70px]" />
                  <div className="absolute -bottom-[10%] left-[20%] w-72 h-72 rounded-full bg-stone-900/70 blur-[80px]" />
                  <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/60 pointer-events-none" />
                </>
              ) : currentTheme.backgroundVariant === "frosted-light" ? (
                <>
                  <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-sky-200/60 blur-[60px]" />
                  <div className="absolute top-[30%] -left-[10%] w-64 h-64 rounded-full bg-amber-100/70 blur-[60px]" />
                  <div className="absolute top-[45%] -right-[10%] w-72 h-72 rounded-full bg-blue-100/60 blur-[70px]" />
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
                </>
              ) : (
                <>
                  <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-sky-500/25 blur-[70px]" />
                  <div className="absolute top-[30%] -left-[15%] w-64 h-64 rounded-full bg-indigo-500/20 blur-[70px]" />
                  <div className="absolute top-[55%] -right-[15%] w-72 h-72 rounded-full bg-amber-500/20 blur-[70px]" />
                  <div className="absolute -bottom-[15%] left-1/3 w-80 h-80 rounded-full bg-cyan-600/20 blur-[80px]" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                </>
              )}
            </div>
          )}

          {/* Status bar notch simulation in mobile mode */}
          {isPhoneView && (
            <div className="w-24 h-3.5 bg-slate-300/60 backdrop-blur-md rounded-full mx-auto mb-3 shrink-0 z-10" />
          )}

          {/* Page Content */}
          <div className="space-y-4 flex-1 z-10">
            {visibleBlocks.length === 0 ? (
              <div className="text-center py-16 opacity-40 text-xs">
                Chưa có khối nội dung nào. Thêm khối ở cột bên trái để bắt đầu.
              </div>
            ) : (
              visibleBlocks.map((block) => {
                switch (block.type) {
                  case "header": {
                    const p = block.payload as HeaderBlockPayload;
                    const displayTitle = p.title || title || "GỜ CAFÉ";
                    const isGocafeBrand =
                      displayTitle.toLowerCase().includes("gờ cafe") ||
                      displayTitle.toLowerCase().includes("g.o cafe") ||
                      displayTitle.toLowerCase().includes("gocafe");
                    const isBeaconsCard = currentTheme.id === "beacons-dark-card";
                    const isBeaconsPortrait = currentTheme.id === "beacons-portrait-card";

                    if (isBeaconsPortrait && p.bannerUrl) {
                      return (
                        <div key={block.id} className="text-center pt-0">
                          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-md bg-[#18191c]">
                            <Image
                              src={p.bannerUrl}
                              alt={displayTitle}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#101010] via-[#101010]/80 to-transparent" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#101010] to-transparent" />

                            <div className="absolute inset-x-0 bottom-2 z-10 flex flex-col items-center text-center px-3">
                              {p.avatarUrl && (
                                <div className="w-[68px] h-[68px] rounded-full overflow-hidden mb-1.5 shadow-md bg-black">
                                  <Image
                                    src={p.avatarUrl}
                                    alt={displayTitle}
                                    width={68}
                                    height={68}
                                    className="w-full h-full object-contain"
                                    unoptimized
                                  />
                                </div>
                              )}
                              {p.bio && (
                                <div className="text-xs leading-relaxed text-[#FEFEFE] font-medium whitespace-pre-line max-w-[90%] mx-auto">
                                  {p.bio}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isBeaconsCard && p.bannerUrl) {
                      return (
                        <div key={block.id} className="text-center pt-0">
                          {/* Inset rounded banner inside card */}
                          <div className="relative w-full aspect-[2.15/1] rounded-2xl overflow-hidden shadow-xs">
                            <Image
                              src={p.bannerUrl}
                              alt={displayTitle}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>

                          {/* Overlapping avatar */}
                          {p.avatarUrl && (
                            <div className="relative -mt-9 mb-1.5 flex justify-center z-20">
                              <div className="w-[76px] h-[76px] rounded-full overflow-hidden shadow-2xl ring-4 ring-[#101113] bg-[#101113]">
                                <Image
                                  src={p.avatarUrl}
                                  alt={displayTitle}
                                  width={76}
                                  height={76}
                                  className="w-full h-full object-cover rounded-full"
                                  unoptimized
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-center gap-1.5 flex-wrap mt-1">
                            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                              {displayTitle}
                            </h1>
                          </div>
                          {p.bio && (
                            <div className="mt-2.5 space-y-1.5 text-xs text-center mx-auto opacity-90 leading-relaxed max-w-[92%]">
                              {renderLnkBioFormattedText(p.bio, "center", accentColor)}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={block.id} className="text-center pt-1">
                        {p.avatarUrl && (
                          <div
                            className="relative w-24 h-24 mx-auto rounded-full overflow-hidden block ring-3 ring-white/25 transition-transform hover:scale-105"
                            style={{
                              boxShadow: `0 0 25px ${accentColor}40, 0 4px 16px rgba(0, 0, 0, 0.25)`,
                            }}
                          >
                            <Image
                              src={p.avatarUrl}
                              alt={displayTitle}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                          <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-[1.2px]">
                            {displayTitle}
                          </h1>
                          {isGocafeBrand && (
                            <CheckCircle2 className="w-3.5 h-3.5 fill-sky-500 text-white drop-shadow-xs" />
                          )}
                        </div>

                        {isGocafeBrand && (
                          <div className="mt-0.5 flex items-center justify-center">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 tracking-wider opacity-90 backdrop-blur-sm">
                              @gocafe.official
                            </span>
                          </div>
                        )}

                        {p.bio && (
                          <div className="mt-3 space-y-1.5 text-xs text-center mx-auto opacity-95">
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
                          <h2 className="text-sm sm:text-base font-bold uppercase tracking-[1px] opacity-95">
                            {p.text}
                          </h2>
                        ) : level === 2 ? (
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[1px] opacity-90">
                            {p.text}
                          </h3>
                        ) : (
                          <h4 className="text-[11px] font-semibold uppercase tracking-[1px] opacity-75">
                            {p.text}
                          </h4>
                        )}
                      </div>
                    );
                  }

                  case "text": {
                    const p = block.payload as TextBlockPayload;
                    const align = p.align || "center";
                    return (
                      <div key={block.id} className="pt-1 space-y-1 text-xs">
                        {p.content
                          ? renderLnkBioFormattedText(p.content, align, accentColor)
                          : null}
                      </div>
                    );
                  }

                  case "image": {
                    const p = block.payload as ImageBlockPayload;
                    return (
                      <div key={block.id} className="space-y-1 overflow-hidden">
                        {p.imageUrl ? (
                          <div className="relative w-full aspect-16/9 overflow-hidden rounded-2xl border border-white/20 shadow-sm">
                            <Image
                              src={p.imageUrl}
                              alt={p.alt || "Banner ảnh"}
                              fill
                              className="object-cover"
                              unoptimized
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-16/9 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center text-xs opacity-60">
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
                    const isBeaconsCard = currentTheme.id === "beacons-dark-card";

                    if (isBeaconsCard) {
                      return (
                        <div
                          key={block.id}
                          className="w-full rounded-2xl border border-white/10 bg-[#18191c] overflow-hidden divide-y divide-white/10 shadow-sm"
                        >
                          {placements.map((pl) => {
                            const iconUrl = pl.mediaOverrideUrl || pl.defaultMediaUrl;
                            const fullLabel = pl.labelOverride || pl.defaultLabel || "";
                            const [titlePart, ...subParts] = fullLabel.split("\n");
                            const subtitle = subParts.join(" ").trim();

                            return (
                              <div
                                key={pl.id}
                                className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {iconUrl && (
                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xs ring-1 ring-white/10 bg-white/5 flex items-center justify-center relative">
                                      <Image
                                        src={iconUrl}
                                        alt={titlePart}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        loading="lazy"
                                      />
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs sm:text-[13px] font-semibold text-white tracking-wide truncate">
                                      {titlePart}
                                    </span>
                                    {subtitle && (
                                      <span className="text-[11px] text-neutral-400 font-normal truncate">
                                        {subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 text-neutral-400 pl-2">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    if (currentTheme.id === "beacons-portrait-card") {
                      return (
                        <div key={block.id} className="flex flex-col gap-2.5 pt-1">
                          {placements.map((pl) => {
                            const iconUrl = pl.mediaOverrideUrl || pl.defaultMediaUrl;
                            const [titlePart, ...subParts] = (pl.labelOverride || pl.defaultLabel || "").split("\n");
                            const subtitle = subParts.join(" ").trim();

                            return (
                              <div
                                key={pl.id}
                                className="relative min-h-[58px] w-full flex items-center justify-between px-3 py-2 rounded-full border-2 border-[#FEFEFE] bg-[#1F2125] text-white select-none shadow-xs"
                              >
                                <div className="w-[38px] h-[38px] rounded-full overflow-hidden shrink-0 bg-black/20 flex items-center justify-center">
                                  {iconUrl && (
                                    <Image
                                      src={iconUrl}
                                      alt={titlePart}
                                      width={38}
                                      height={38}
                                      className="w-full h-full object-cover rounded-full"
                                      unoptimized
                                      loading="lazy"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-2 min-w-0">
                                  <span className="text-[13px] font-semibold text-[#FEFEFE] truncate max-w-full">
                                    {titlePart}
                                  </span>
                                  {subtitle && (
                                    <span className="text-[11px] text-neutral-300 font-normal truncate max-w-full">
                                      {subtitle}
                                    </span>
                                  )}
                                </div>
                                <div className="w-5 flex items-center justify-end shrink-0 text-neutral-400">
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={block.id}
                        className={isGrid ? "grid grid-cols-2 gap-2.5 pt-1" : "space-y-[18px] pt-1"}
                      >
                        {placements.map((pl) => {
                          const iconUrl = pl.mediaOverrideUrl || pl.defaultMediaUrl;
                          const label = pl.labelOverride || pl.defaultLabel;

                          return (
                            <div
                              key={pl.id}
                              className={`relative h-[64px] min-h-[64px] w-full flex items-center justify-center p-2 border transition-all duration-200 hover:scale-[1.01] ${pillRadiusClass} ${
                                isGlassmorphism
                                  ? "backdrop-blur-xl shadow-md border-white/20"
                                  : "border-2 shadow-xs"
                              }`}
                              style={{
                                backgroundColor: currentTheme.cardBackground,
                                color: currentTheme.cardTextColor,
                                borderColor:
                                  currentTheme.cardBorderColor || currentTheme.cardBackground,
                                boxShadow: isGlassmorphism
                                  ? "0 6px 20px -2px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.15)"
                                  : undefined,
                              }}
                            >
                              {iconUrl && (
                                <div className="w-[48px] h-[48px] rounded-full overflow-hidden absolute left-[8px] top-1/2 -translate-y-1/2 bg-white/20 shrink-0 shadow-xs ring-1 ring-white/20">
                                  <Image
                                    src={iconUrl}
                                    alt={label}
                                    fill
                                    className="object-cover rounded-full"
                                    unoptimized
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <span
                                className={`block w-full text-center font-bold uppercase text-xs sm:text-[13px] tracking-[0.8px] leading-snug wrap-break-word ${
                                  iconUrl ? "px-14 sm:px-16" : "px-4"
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
                    const isAnyBeacons =
                      currentTheme.id === "beacons-dark-card" ||
                      currentTheme.id === "beacons-portrait-card";

                    if (isAnyBeacons) {
                      return (
                        <div key={block.id} className="flex items-center justify-center gap-5 my-1">
                          {placements.map((pl) => (
                            <div
                              key={pl.id}
                              className="text-white hover:text-neutral-300 transition-colors"
                              title={pl.labelOverride || pl.defaultLabel}
                            >
                              {resolveSmartIcon(
                                pl.defaultUrl,
                                pl.labelOverride || pl.defaultLabel,
                                "social",
                                "w-5 h-5"
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }

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
                              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-110 shadow-xs ${
                                isGlassmorphism ? "backdrop-blur-xl border-white/30" : "border-2"
                              }`}
                              style={{
                                backgroundColor: currentTheme.cardBackground,
                                color: currentTheme.cardTextColor,
                                borderColor:
                                  currentTheme.cardBorderColor || "rgba(255, 255, 255, 0.2)",
                                boxShadow: isGlassmorphism
                                  ? "0 4px 12px rgba(0, 0, 0, 0.18)"
                                  : undefined,
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
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                resolveSmartIcon(pl.defaultUrl, label, "social", "w-4 h-4")
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
                        ? "h-12"
                        : p.height === "lg"
                          ? "h-8"
                          : p.height === "md"
                            ? "h-5"
                            : "h-2.5";
                    return <div key={block.id} className={h} />;
                  }

                  case "divider": {
                    const p = block.payload as DividerBlockPayload;
                    const style = p.style || "solid";
                    const borderStyleClass =
                      style === "dashed"
                        ? "border-dashed"
                        : style === "dotted"
                          ? "border-dotted"
                          : "border-solid";
                    return (
                      <div key={block.id} className="py-2">
                        <hr
                          className={`border-t opacity-20 ${borderStyleClass}`}
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

          {/* Footer */}
          <div className="pt-6 pb-2 text-center z-10 space-y-1.5">
            <span
              className="font-medium text-[11px] tracking-widest uppercase opacity-50 select-none"
              style={{ color: currentTheme.textColor }}
            >
              GỜ CAFÉ © 2026
            </span>
          </div>
        </div>
      </div>

        {/* Right Drag Handle */}
        <div
          onPointerDown={(e) => onPointerDownHandle(e, "right")}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onDoubleClick={() => setFrameWidth(375)}
          className={`absolute -right-6 z-40 flex items-center justify-center w-5 h-24 rounded-full border border-border/80 bg-background/95 hover:bg-primary hover:text-white text-muted-foreground shadow-xl cursor-ew-resize transition-all duration-150 touch-none select-none ${
            isDragging === "right"
              ? "bg-primary text-white scale-110 shadow-primary/30 ring-2 ring-primary/40"
              : "opacity-70 group-hover:opacity-100"
          }`}
          title="Kéo sang ngang để thu nhỏ / phóng to (nhấp đúp để đặt lại 375px)"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
