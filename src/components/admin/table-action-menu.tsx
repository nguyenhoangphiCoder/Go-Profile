"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export interface TableActionMenuProps {
  title?: string;
  children: (close: () => void) => React.ReactNode;
  widthClass?: string;
  buttonClassName?: string;
}

/**
 * Dropdown menu dành cho các hàng bảng (Table Row Actions):
 * Sử dụng React Portal để đưa Menu ra trực tiếp document.body với position: fixed.
 * Đảm bảo 100% không bao giờ bị cắt viền (clipped) bởi overflow-x-auto,
 * overflow-hidden, thead hay thanh phân trang (pagination footer).
 */
export function TableActionMenu({
  title,
  children,
  widthClass = "w-52",
  buttonClassName = "",
}: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = 220;

    const opensUpward = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

    if (opensUpward) {
      setCoords({
        bottom: Math.max(8, window.innerHeight - rect.top + 6),
        right: Math.max(8, window.innerWidth - rect.right),
      });
    } else {
      setCoords({
        top: Math.max(8, rect.bottom + 6),
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20"
            : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
        } ${buttonClassName}`}
        title="Tùy chọn thao tác"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {mounted && isOpen && coords && createPortal(
        <>
          {/* Backdrop toàn màn hình để đóng khi click ra ngoài */}
          <div
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
            onClick={close}
          />

          {/* Popover Menu nổi tự do, không bao giờ bị cắt viền */}
          <div
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              right: `${coords.right}px`,
            }}
            className={`${widthClass} rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl p-1.5 z-[9999] text-xs animate-in fade-in-0 zoom-in-95 duration-150 select-none`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1">
                {title}
              </div>
            )}
            {children(close)}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
