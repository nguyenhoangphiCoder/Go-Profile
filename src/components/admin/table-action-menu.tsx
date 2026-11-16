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
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; right: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20"
            : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
        } ${buttonClassName}`}
        title="Tùy chọn thao tác"
        aria-label={title || "Tùy chọn thao tác"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Menu chỉ mở sau khi người dùng bấm nút (luôn ở phía client), nên dùng document trực tiếp */}
      {isOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop toàn màn hình để đóng khi click ra ngoài */}
            <div className="fixed inset-0 z-[9998] cursor-default bg-transparent" onClick={close} />

            {/* Popover Menu nổi tự do, không bao giờ bị cắt viền */}
            <div
              style={{
                position: "fixed",
                top: coords.top !== undefined ? `${coords.top}px` : undefined,
                bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
                right: `${coords.right}px`,
              }}
              role="menu"
              className={`${widthClass} max-w-[calc(100vw-1rem)] rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl p-1.5 z-[9999] text-sm sm:text-xs animate-in fade-in-0 zoom-in-95 duration-150 select-none [&>a]:min-h-11 [&>button]:min-h-11 sm:[&>a]:min-h-0 sm:[&>button]:min-h-0`}
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
