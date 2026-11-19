"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Crop, Loader2, Move, AlertCircle } from "lucide-react";
import {
  CROP_ASPECT_OPTIONS,
  adjustOffsetForZoom,
  clampCropOffset,
  computeCoverScale,
  computeCropBoxSize,
  defaultAspectForHint,
  exportCroppedImageFile,
  type AspectHint,
  type CropAspectKey,
  type Point,
  type Size,
} from "@/lib/image-crop";

export interface CropImageSource {
  file?: File;
  url?: string;
  filename?: string | null;
  mimeType?: string;
}

export interface ImageCropModalProps {
  isOpen: boolean;
  source: CropImageSource | null;
  aspectHint?: AspectHint;
  initialAspect?: CropAspectKey;
  title?: string;
  allowUseOriginal?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void | Promise<void>;
  onUseOriginal?: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

export function ImageCropModal(props: ImageCropModalProps) {
  if (!props.isOpen || !props.source) return null;
  const sourceKey = `${props.source.url ?? ""}|${props.source.filename ?? ""}|${props.source.file?.size ?? 0}|${props.aspectHint ?? "standard"}|${props.initialAspect ?? ""}`;
  return <ImageCropModalContent key={sourceKey} {...props} source={props.source} />;
}

function ImageCropModalContent({
  source,
  aspectHint = "standard",
  initialAspect,
  title = "Cắt & căn chỉnh hình ảnh",
  allowUseOriginal = false,
  isSubmitting = false,
  error = null,
  onCancel,
  onConfirm,
  onUseOriginal,
}: Omit<ImageCropModalProps, "source"> & { source: CropImageSource }) {
  const [aspectKey, setAspectKey] = useState<CropAspectKey>(
    initialAspect || defaultAspectForHint(aspectHint)
  );
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [stageBounds, setStageBounds] = useState<Size>({ width: 420, height: 300 });

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Tạo object URL nếu nguồn là File từ máy tính
  const sourceFile = source.file ?? null;
  const objectUrl = useMemo(() => {
    if (!sourceFile) return null;
    return URL.createObjectURL(sourceFile);
  }, [sourceFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const imageSrc = objectUrl || source.url || null;

  // Theo dõi kích thước sân khấu để khung cắt luôn vừa màn hình (mobile & desktop)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageBounds({
          width: Math.max(200, Math.floor(rect.width - 48)),
          height: Math.max(180, Math.floor(rect.height - 40)),
        });
      }
    };
    update();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tính tỉ lệ khung cắt hiện tại
  const activeRatio = useMemo(() => {
    const opt = CROP_ASPECT_OPTIONS.find((o) => o.key === aspectKey);
    if (opt?.ratio) return opt.ratio;
    if (naturalSize && naturalSize.height > 0) {
      return naturalSize.width / naturalSize.height;
    }
    return 1;
  }, [aspectKey, naturalSize]);

  const cropBox = useMemo(
    () => computeCropBoxSize(activeRatio, stageBounds.width, stageBounds.height),
    [activeRatio, stageBounds]
  );

  const baseScale = useMemo(
    () => (naturalSize ? computeCoverScale(naturalSize, cropBox) : 1),
    [naturalSize, cropBox]
  );

  const baseDisplaySize = useMemo<Size>(() => {
    if (!naturalSize) return { width: cropBox.width, height: cropBox.height };
    return {
      width: naturalSize.width * baseScale,
      height: naturalSize.height * baseScale,
    };
  }, [naturalSize, baseScale, cropBox]);

  // Luôn giữ offset trong biên an toàn khi kích thước khung cắt thay đổi
  const safeOffset = useMemo(() => {
    if (!naturalSize) return offset;
    return clampCropOffset(offset, naturalSize, cropBox, zoom);
  }, [offset, naturalSize, cropBox, zoom]);

  const isCircleMask = aspectHint === "circle" && aspectKey === "1:1";

  const applyZoom = useCallback(
    (nextZoomRaw: number) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoomRaw.toFixed(3))));
      if (naturalSize) {
        setOffset((prev) => adjustOffsetForZoom(prev, zoom, nextZoom, naturalSize, cropBox));
      }
      setZoom(nextZoom);
    },
    [naturalSize, zoom, cropBox]
  );

  const handleAspectChange = (nextKey: CropAspectKey) => {
    setAspectKey(nextKey);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize || isBusy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: safeOffset.x,
      originY: safeOffset.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !naturalSize) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(
      clampCropOffset({ x: drag.originX + dx, y: drag.originY + dy }, naturalSize, cropBox, zoom)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!naturalSize || isBusy) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    applyZoom(zoom + delta);
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !naturalSize) return;

    setExportError(null);
    setIsExporting(true);
    try {
      const preferredMime =
        source?.mimeType ||
        source?.file?.type ||
        (source?.filename?.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");

      const maxDim = aspectHint === "circle" ? 1024 : 1600;
      const croppedFile = await exportCroppedImageFile({
        image: img,
        cropBox,
        offset: safeOffset,
        zoom,
        maxOutputDimension: maxDim,
        preferredMimeType: preferredMime,
        originalFilename: source?.filename || source?.file?.name,
      });

      await onConfirm(croppedFile);
    } catch (err: unknown) {
      console.error("Image crop export error:", err);
      setExportError(
        err instanceof Error
          ? err.message
          : "Không thể cắt ảnh này. Vui lòng thử tải ảnh từ máy tính."
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (!imageSrc) return null;

  const isBusy = isExporting || isSubmitting;
  const activeError = error || exportError || loadError;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Crop className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h2>
              <p className="text-[11px] text-muted-foreground truncate">
                Kéo ảnh để căn vị trí và phóng to / thu nhỏ cho vừa khung
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect ratio selector */}
        <div className="px-5 py-2.5 border-b border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">
            Khung tỉ lệ:
          </span>
          {CROP_ASPECT_OPTIONS.map((opt) => {
            const active = aspectKey === opt.key;
            const label =
              aspectHint === "circle" && opt.key === "1:1" ? "1:1 Tròn (Avatar)" : opt.label;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={isBusy}
                onClick={() => handleAspectChange(opt.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Error banner */}
        {activeError && (
          <div className="mx-5 mt-3 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{activeError}</span>
          </div>
        )}

        {/* Interactive Crop Stage */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 flex flex-col gap-3">
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`relative w-full h-[270px] sm:h-[330px] rounded-2xl bg-neutral-950 overflow-hidden flex items-center justify-center touch-none select-none ${
              naturalSize ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
            }`}
          >
            {/* Image layer */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Xem trước ảnh cắt"
              crossOrigin={source?.file ? undefined : "anonymous"}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setNaturalSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                  setLoadError(null);
                }
              }}
              onError={() => {
                setLoadError(
                  "Không thể tải ảnh để cắt (có thể do lỗi kết nối hoặc chính sách CORS). Hãy thử tải ảnh trực tiếp từ máy tính."
                );
              }}
              style={{
                width: `${baseDisplaySize.width}px`,
                height: `${baseDisplaySize.height}px`,
                maxWidth: "none",
                maxHeight: "none",
                transform: `translate3d(${safeOffset.x}px, ${safeOffset.y}px, 0) scale(${zoom})`,
                transformOrigin: "center center",
                opacity: naturalSize ? 1 : 0,
              }}
              className="pointer-events-none select-none will-change-transform"
            />

            {/* Loading indicator */}
            {!naturalSize && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải ảnh...</span>
              </div>
            )}

            {/* Crop frame overlay with dimmed exterior */}
            {naturalSize && (
              <div
                style={{
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)",
                }}
                className={`pointer-events-none absolute border-2 border-white/95 transition-[border-radius] duration-150 ${
                  isCircleMask ? "rounded-full" : "rounded-xl"
                }`}
              >
                {/* Rule-of-thirds grid */}
                <div
                  className={`absolute inset-0 overflow-hidden transition-opacity duration-150 ${
                    isCircleMask ? "rounded-full" : "rounded-[10px]"
                  } ${isDragging ? "opacity-70" : "opacity-30"}`}
                >
                  <div className="absolute inset-x-0 top-1/3 border-t border-white/60" />
                  <div className="absolute inset-x-0 top-2/3 border-t border-white/60" />
                  <div className="absolute inset-y-0 left-1/3 border-l border-white/60" />
                  <div className="absolute inset-y-0 left-2/3 border-l border-white/60" />
                </div>
              </div>
            )}

            {/* Floating drag hint badge */}
            {naturalSize && !isDragging && (
              <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/65 text-white/90 text-[11px] flex items-center gap-1.5 backdrop-blur-xs">
                <Move className="w-3 h-3" />
                <span>Kéo ảnh để di chuyển</span>
              </div>
            )}
          </div>

          {/* Zoom & Reset Controls */}
          <div className="flex items-center gap-2.5 px-1">
            <button
              type="button"
              onClick={() => applyZoom(zoom - ZOOM_STEP)}
              disabled={isBusy || !naturalSize || zoom <= MIN_ZOOM}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40"
              title="Thu nhỏ"
              aria-label="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.02}
              value={zoom}
              disabled={isBusy || !naturalSize}
              onChange={(e) => applyZoom(parseFloat(e.target.value))}
              aria-label="Mức phóng to ảnh"
              className="flex-1 accent-primary cursor-pointer h-1.5 rounded-lg"
            />

            <button
              type="button"
              onClick={() => applyZoom(zoom + ZOOM_STEP)}
              disabled={isBusy || !naturalSize || zoom >= MAX_ZOOM}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40"
              title="Phóng to"
              aria-label="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleReset}
              disabled={
                isBusy || !naturalSize || (zoom === 1 && safeOffset.x === 0 && safeOffset.y === 0)
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-medium text-foreground transition-colors cursor-pointer disabled:opacity-40"
              title="Đặt lại vị trí ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div>
            {allowUseOriginal && onUseOriginal && (
              <button
                type="button"
                onClick={onUseOriginal}
                disabled={isBusy}
                className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                Dùng ảnh gốc (không cắt)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBusy || !naturalSize || Boolean(loadError)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-blue-700 shadow-xs shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crop className="w-3.5 h-3.5" />
              )}
              <span>{isBusy ? "Đang lưu ảnh..." : "Cắt & áp dụng"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
