"use client";

import { memo, useMemo, useState, useRef } from "react";
import { PageRenderer } from "@/features/renderer/page-renderer";
import { fromEditorBlocks } from "@/features/renderer/adapters";
import type { EditorBlockItem, PageThemeConfig } from "../../types";
import { GripVertical, RotateCcw } from "lucide-react";

interface LivePreviewProps {
  themeConfig: PageThemeConfig;
  title: string;
  blocks: EditorBlockItem[];
  previewMode: "mobile" | "desktop";
  zoomScale?: number;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
}

export const LivePreview = memo(function LivePreview({
  themeConfig,
  title,
  blocks,
  previewMode,
  zoomScale = 1,
  selectedBlockId,
  onSelectBlock,
}: LivePreviewProps) {
  const [frameWidth, setFrameWidth] = useState<number>(previewMode === "mobile" ? 375 : 620);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);
  const dragStartXRef = useRef(0);
  const startWidthRef = useRef(frameWidth);
  const renderBlocks = useMemo(() => fromEditorBlocks(blocks), [blocks]);
  // Khi đổi Mobile / Desktop ở thanh tiêu đề, PageEditor truyền key={previewMode} để component
  // khởi tạo lại với độ rộng mặc định (thay cho useEffect + setState gây render lặp).

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
      320,
      Math.min(960, Math.round(startWidthRef.current + deltaX * multiplier))
    );
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

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-0 lg:p-4 select-none relative">
      {/* DevTools Responsive Controls Toolbar (chỉ desktop: trên điện thoại bản xem trước đã đúng kích thước thật) */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-xs shadow-md z-30 mb-3">
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
        className="transition-transform duration-200 ease-out origin-center flex items-center justify-center relative group w-full h-full lg:w-auto lg:h-auto lg:[transform:var(--preview-zoom)]"
        style={{ ["--preview-zoom" as string]: `scale(${zoomScale})` }}
      >
        {/* Left Drag Handle */}
        <div
          onPointerDown={(e) => onPointerDownHandle(e, "left")}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onDoubleClick={() => setFrameWidth(375)}
          className={`absolute -left-6 z-40 hidden lg:flex items-center justify-center w-5 h-24 rounded-full border border-border/80 bg-background/95 hover:bg-primary hover:text-white text-muted-foreground shadow-xl cursor-ew-resize transition-all duration-150 touch-none select-none ${
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
          className={`transition-all duration-75 overflow-hidden relative w-full h-full rounded-2xl border border-border/60 shadow-sm lg:w-[var(--frame-w)] lg:max-w-full lg:h-[720px] lg:max-h-[calc(100vh-170px)] ${
            isPhoneView
              ? "lg:rounded-[52px] lg:border-[10px] lg:border-slate-900 lg:bg-slate-950 lg:p-2.5 lg:shadow-2xl lg:ring-1 lg:ring-white/10"
              : "lg:rounded-3xl lg:border-2 lg:border-slate-700/30 lg:bg-slate-900/10 lg:p-3 lg:shadow-2xl"
          }`}
          style={{ ["--frame-w" as string]: `${frameWidth}px` }}
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
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-800/80 rounded-t-xl mb-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 bg-slate-950/60 rounded-md px-3 py-1 text-center font-mono text-[10px] text-slate-400 truncate">
                https://gocafe.me/{title.toLowerCase().replace(/[^a-z0-9]/g, "") || "profile"} (
                {frameWidth}px)
              </div>
            </div>
          )}

          {/* Device screen: dùng chung bộ render với trang công khai để xem trước đúng như thật */}
          <div
            className={`w-full h-full overflow-y-auto overscroll-contain rounded-2xl ${
              isPhoneView ? "lg:rounded-[40px]" : "lg:rounded-xl"
            } relative select-none scrollbar-thin scrollbar-thumb-slate-400/20`}
            suppressHydrationWarning
          >
            <PageRenderer
              mode="preview"
              title={title}
              theme={themeConfig}
              blocks={renderBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
            />
          </div>
        </div>

        {/* Right Drag Handle */}
        <div
          onPointerDown={(e) => onPointerDownHandle(e, "right")}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onDoubleClick={() => setFrameWidth(375)}
          className={`absolute -right-6 z-40 hidden lg:flex items-center justify-center w-5 h-24 rounded-full border border-border/80 bg-background/95 hover:bg-primary hover:text-white text-muted-foreground shadow-xl cursor-ew-resize transition-all duration-150 touch-none select-none ${
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
});
