"use client";

import { memo, useEffect, useRef, useState } from "react";
import { GripVertical, RotateCcw } from "lucide-react";
import { LandingShell, type SitePreviewSection } from "@/features/renderer/landing-shell";
import type { PublicSiteShell } from "@/features/public/types";

export type SitePreviewDevice = "mobile" | "tablet" | "desktop";
export type SitePreviewZoom = "auto" | 1 | 0.9 | 0.8;

interface SiteLivePreviewProps {
  siteShell: PublicSiteShell;
  activeTab: "nav" | "header" | "footer";
  homePageSlug?: string;
  previewMode: SitePreviewDevice;
  zoomMode: SitePreviewZoom;
  compactBody: boolean;
  scrollSignal?: { target: "top" | "bottom"; seq: number } | null;
  activeSection?: SitePreviewSection | null;
  onSelectSection?: (section: SitePreviewSection) => void;
  onDeviceChange?: (mode: SitePreviewDevice) => void;
}

const DEVICE_DEFAULT_WIDTH: Record<SitePreviewDevice, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

export const SiteLivePreview = memo(function SiteLivePreview({
  siteShell,
  activeTab,
  homePageSlug,
  previewMode,
  zoomMode,
  compactBody,
  scrollSignal,
  activeSection,
  onSelectSection,
  onDeviceChange,
}: SiteLivePreviewProps) {
  const defaultWidth = DEVICE_DEFAULT_WIDTH[previewMode];
  const [frameWidth, setFrameWidth] = useState<number>(defaultWidth);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 900, h: 740 });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef(0);
  const startWidthRef = useRef(frameWidth);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setStageSize({ w: rect.width, h: rect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tự động cuộn tới Header hoặc Footer khi đổi tab
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (activeTab === "footer") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // Cuộn theo lệnh nút bấm Header / Footer ở thanh điều khiển trên cùng
  useEffect(() => {
    if (!scrollSignal || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTo({
      top: scrollSignal.target === "bottom" ? el.scrollHeight : 0,
      behavior: "smooth",
    });
  }, [scrollSignal]);

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
    const nextWidth = Math.max(
      340,
      Math.min(1440, Math.round(startWidthRef.current + deltaX * multiplier))
    );
    setFrameWidth(nextWidth);
    if (onDeviceChange) {
      if (nextWidth <= 460 && previewMode !== "mobile") onDeviceChange("mobile");
      else if (nextWidth > 460 && nextWidth <= 900 && previewMode !== "tablet")
        onDeviceChange("tablet");
      else if (nextWidth > 900 && previewMode !== "desktop") onDeviceChange("desktop");
    }
  };

  const onPointerUpHandle = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const isPhoneView = frameWidth <= 460;

  // Tính zoom tự động khớp trọn không gian Stage (đặc biệt tối ưu cho Desktop 1280px)
  const horizontalMargin = 72; // chừa chỗ cho 2 tay kéo trái/phải + padding
  const topToolbarSpace = 54; // chừa chỗ cho DevTools width bar
  const usableWidth = Math.max(320, stageSize.w - horizontalMargin);
  const usableHeight = Math.max(420, stageSize.h - topToolbarSpace - 24);

  const fitZoom = Math.min(1, usableWidth / frameWidth);
  const effectiveZoom =
    zoomMode === "auto"
      ? Number(Math.max(0.45, fitZoom).toFixed(3))
      : Number(Math.min(zoomMode, fitZoom).toFixed(3));

  const targetVisualHeight = isPhoneView ? Math.min(720, usableHeight) : usableHeight;
  const baseFrameHeight = Math.max(480, Math.round(targetVisualHeight / effectiveZoom));
  const scaledWidth = Math.round(frameWidth * effectiveZoom);
  const scaledHeight = Math.round(baseFrameHeight * effectiveZoom);

  const siteName = siteShell.settings?.site_name?.trim() || "GỜ CAFÉ";
  const firstPageSlug = siteShell.nav_items?.find(
    (item) => item.target_type === "page" && item.target_slug
  )?.target_slug;
  const activePreviewSlug = homePageSlug?.trim() || firstPageSlug || undefined;
  const previewUrlSlug = homePageSlug?.trim() || firstPageSlug || "trang-chu";

  return (
    <div
      ref={stageRef}
      className="flex flex-col items-center justify-center h-full w-full p-2 lg:px-5 lg:pt-14 lg:pb-4 select-none relative overflow-hidden"
    >
      {/* DevTools Responsive Controls Toolbar (giống hệt Page Editor LivePreview) */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-xs shadow-md z-30 mb-3 shrink-0">
        <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded-md">
          <span>{frameWidth}</span>
          <span className="text-[10px] text-muted-foreground font-normal">px</span>
        </div>

        {effectiveZoom < 0.995 && (
          <span className="font-mono text-[10px] text-muted-foreground px-1">
            {Math.round(effectiveZoom * 100)}%
          </span>
        )}

        <div className="h-3 w-px bg-border/80 mx-1" />

        {[375, 768, 1024, 1280, 1440].map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => {
              setFrameWidth(w);
              if (onDeviceChange) {
                onDeviceChange(w <= 460 ? "mobile" : w <= 900 ? "tablet" : "desktop");
              }
            }}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              frameWidth === w
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={`${w}px`}
          >
            {w}
          </button>
        ))}

        <div className="h-3 w-px bg-border/80 mx-1" />

        <button
          type="button"
          onClick={() => setFrameWidth(defaultWidth)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={`Đặt lại kích thước mặc định (${defaultWidth}px)`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scaled Wrapper khớp đúng kích thước hiển thị */}
      <div
        className="relative flex items-start justify-center group w-full h-full lg:w-auto lg:h-auto"
        style={{
          width: undefined,
          height: undefined,
        }}
      >
        {/* Mobile/Tablet (< lg): hiển thị tràn 100% không cần scale */}
        <div className="lg:hidden w-full h-full rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-white">
          <div
            data-preview-scroll
            className="w-full h-full overflow-y-auto overscroll-contain bg-white text-[#111111]"
          >
            <LandingShell
              mode="preview"
              showFloatingInPreview
              siteShell={siteShell}
              currentSlug={activePreviewSlug}
              activeSection={activeSection}
              onSelectSection={onSelectSection}
            >
              <SampleLandingBody siteName={siteName} compactBody={compactBody} />
            </LandingShell>
          </div>
        </div>

        {/* Desktop (lg+): Scaled Device / Browser Frame với 2 tay kéo DevTools */}
        <div
          className="hidden lg:block relative"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {/* Left Drag Handle */}
          <div
            onPointerDown={(e) => onPointerDownHandle(e, "left")}
            onPointerMove={onPointerMoveHandle}
            onPointerUp={onPointerUpHandle}
            onDoubleClick={() => setFrameWidth(defaultWidth)}
            className={`absolute -left-7 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-24 rounded-full border border-border/80 bg-background/95 hover:bg-primary hover:text-white text-muted-foreground shadow-xl cursor-ew-resize transition-all duration-150 touch-none select-none ${
              isDragging === "left"
                ? "bg-primary text-white scale-110 shadow-primary/30 ring-2 ring-primary/40"
                : "opacity-70 group-hover:opacity-100"
            }`}
            title="Kéo sang ngang để thu nhỏ / phóng to (nhấp đúp để đặt lại)"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Scaled inner box */}
          <div
            className="origin-top-left transition-transform duration-150 ease-out"
            style={{
              width: `${frameWidth}px`,
              height: `${baseFrameHeight}px`,
              transform: `scale(${effectiveZoom})`,
            }}
          >
            <div
              className={`w-full h-full flex flex-col overflow-hidden relative transition-all duration-75 ${
                isPhoneView
                  ? "rounded-[52px] border-[10px] border-slate-900 bg-slate-950 p-2.5 shadow-2xl ring-1 ring-white/10"
                  : "rounded-3xl border-2 border-slate-700/25 bg-slate-900/10 p-2.5 shadow-2xl"
              }`}
            >
              {/* Drag Width Badge */}
              {isDragging && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold shadow-xl pointer-events-none">
                  {frameWidth} px
                </div>
              )}

              {/* Desktop / Tablet Browser Bar */}
              {!isPhoneView && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/90 rounded-t-2xl mb-1 text-[11px] text-slate-300 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 bg-slate-950/60 rounded-md px-3 py-1 text-center font-mono text-[10px] text-slate-400 truncate">
                    https://gocafe.me/{previewUrlSlug} ({frameWidth}px)
                  </div>
                </div>
              )}

              {/* Scrollable Website Viewport */}
              <div
                ref={scrollRef}
                data-preview-scroll
                className={`flex-1 w-full overflow-y-auto overscroll-contain bg-white text-[#111111] relative ${
                  isPhoneView ? "rounded-[40px]" : "rounded-b-xl"
                }`}
              >
                <LandingShell
                  mode="preview"
                  showFloatingInPreview
                  siteShell={siteShell}
                  currentSlug={activePreviewSlug}
                  activeSection={activeSection}
                  onSelectSection={onSelectSection}
                >
                  <SampleLandingBody siteName={siteName} compactBody={compactBody} />
                </LandingShell>
              </div>
            </div>
          </div>

          {/* Right Drag Handle */}
          <div
            onPointerDown={(e) => onPointerDownHandle(e, "right")}
            onPointerMove={onPointerMoveHandle}
            onPointerUp={onPointerUpHandle}
            onDoubleClick={() => setFrameWidth(defaultWidth)}
            className={`absolute -right-7 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-24 rounded-full border border-border/80 bg-background/95 hover:bg-primary hover:text-white text-muted-foreground shadow-xl cursor-ew-resize transition-all duration-150 touch-none select-none ${
              isDragging === "right"
                ? "bg-primary text-white scale-110 shadow-primary/30 ring-2 ring-primary/40"
                : "opacity-70 group-hover:opacity-100"
            }`}
            title="Kéo sang ngang để thu nhỏ / phóng to (nhấp đúp để đặt lại)"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
});

function SampleLandingBody({ siteName, compactBody }: { siteName: string; compactBody: boolean }) {
  return (
    <div className="bg-[#FAF8F5] text-[#111111]">
      <section
        className={`max-w-[1160px] mx-auto px-5 @min-[48rem]:px-8 ${
          compactBody ? "py-10" : "py-16"
        } text-center space-y-4`}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#B88A44]/30 bg-[#B88A44]/10 text-[#9A6F2E] text-[11px] font-semibold uppercase tracking-[0.14em]">
          Nội dung trang mẫu (Landing Page)
        </span>
        <h1 className="text-2xl @min-[48rem]:text-4xl font-bold tracking-tight text-[#111111] max-w-2xl mx-auto leading-tight">
          {siteName} — Trải nghiệm không gian &amp; hương vị đặc trưng
        </h1>
        <p className="text-xs @min-[48rem]:text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
          Bấm trực tiếp vào <strong>Logo</strong>, <strong>Menu</strong>, <strong>Nút CTA</strong>,{" "}
          <strong>Thanh thông báo</strong>, <strong>Footer</strong> hoặc <strong>Nút nổi</strong>{" "}
          trên khung mô phỏng để mở ngay đúng mục cấu hình bên trái.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <span className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold">
            Khám phá ngay
          </span>
          <span className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-[#111111] text-xs font-semibold">
            Tìm hiểu thêm
          </span>
        </div>
      </section>

      {!compactBody && (
        <section className="max-w-[1160px] mx-auto px-5 @min-[48rem]:px-8 pb-16 space-y-6">
          <div className="grid grid-cols-1 @min-[44rem]:grid-cols-3 gap-4">
            {[
              {
                tag: "01",
                title: "Khối giới thiệu thương hiệu",
                desc: "Cuộn xuống để kiểm tra thanh Header dính (Sticky) và độ mờ nền.",
              },
              {
                tag: "02",
                title: "Danh mục sản phẩm / dịch vụ",
                desc: "Kiểm tra sự hài hòa giữa màu chữ Menu, CTA và nền nội dung.",
              },
              {
                tag: "03",
                title: "Hệ thống cửa hàng & Liên hệ",
                desc: "Kiểm tra vị trí Nút nổi (Trái/Phải) và nút Lên đầu trang.",
              },
            ].map((card) => (
              <div
                key={card.tag}
                className="p-5 rounded-2xl bg-white border border-neutral-200/80 space-y-2 shadow-2xs"
              >
                <span className="text-[11px] font-mono font-bold text-[#B88A44]">{card.tag}</span>
                <h3 className="text-sm font-bold text-[#111111]">{card.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-2xl bg-[#111111] text-white text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D8B478] font-semibold">
              Khu vực tương phản tối
            </p>
            <p className="text-sm text-white/80 max-w-lg mx-auto">
              Giúp bạn quan sát thanh Header kính mờ (Glass) khi cuộn qua nền tối và độ nổi bật của
              thanh nút liên hệ nổi.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
