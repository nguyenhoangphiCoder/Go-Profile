"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
  menuClassName?: string;
  ariaLabel?: string;
  title?: string;
  id?: string;
  name?: string;
  onTriggerMouseDown?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const SIZE_CLASSES = {
  xs: "h-7 px-2 text-[11px] rounded-lg gap-1",
  sm: "h-8 px-2.5 text-xs rounded-lg gap-1.5",
  md: "h-9 px-3 text-[13px] rounded-lg gap-2",
} as const;

export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  disabled = false,
  size = "md",
  className,
  menuClassName,
  ariaLabel,
  title,
  id,
  name,
  onTriggerMouseDown,
}: SelectProps) {
  const autoId = useId();
  const listboxId = `${id || autoId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    minWidth: number;
    maxWidth: number;
  } | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  const computeCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const estimatedH = Math.min(268, options.length * 36 + 12);
    const spaceBelow = viewportH - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUpward = spaceBelow < estimatedH && spaceAbove > spaceBelow;

    const minWidth = Math.max(rect.width, 140);
    const maxWidth = Math.min(viewportW - 16, Math.max(rect.width, 320));
    const clampedLeft = Math.max(8, Math.min(rect.left, viewportW - minWidth - 8));

    return openUpward
      ? {
          bottom: Math.max(8, viewportH - rect.top + 4),
          left: clampedLeft,
          minWidth,
          maxWidth,
        }
      : {
          top: Math.max(8, rect.bottom + 4),
          left: clampedLeft,
          minWidth,
          maxWidth,
        };
  }, [options.length]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const c = computeCoords();
    if (!c) return;
    setCoords(c);
    const idx = options.findIndex((o) => o.value === value && !o.disabled);
    setHighlightedIndex(idx >= 0 ? idx : options.findIndex((o) => !o.disabled));
    setOpen(true);
  }, [computeCoords, disabled, options, value]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const pick = useCallback(
    (opt: SelectOption) => {
      if (opt.disabled) return;
      onChange(opt.value);
      closeMenu();
      triggerRef.current?.focus();
    },
    [closeMenu, onChange]
  );

  useEffect(() => {
    if (!open) return;

    const handleScroll = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      closeMenu();
    };
    const handleResize = () => closeMenu();
    const handlePointerDown = (e: Event) => {
      const target = e.target as Node | null;
      if (target && (triggerRef.current?.contains(target) || menuRef.current?.contains(target))) {
        return;
      }
      closeMenu();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, closeMenu]);

  const moveHighlight = (delta: 1 | -1) => {
    if (options.length === 0) return;
    let next = highlightedIndex;
    for (let step = 0; step < options.length; step++) {
      next = (next + delta + options.length) % options.length;
      if (!options[next].disabled) {
        setHighlightedIndex(next);
        return;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        pick(options[highlightedIndex]);
      }
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
        onMouseDown={onTriggerMouseDown}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center justify-between border border-border bg-card text-foreground font-medium transition-all cursor-pointer select-none",
          "hover:border-foreground/25 hover:bg-muted/30",
          "focus:outline-hidden focus:ring-2 focus:ring-ring/20 focus:border-foreground/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          open && "border-foreground/40 ring-2 ring-ring/15",
          SIZE_CLASSES[size],
          className
        )}
      >
        <span className={cn("truncate text-left", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-150",
            open && "rotate-180 text-foreground"
          )}
        />
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              minWidth: `${coords.minWidth}px`,
              maxWidth: `${coords.maxWidth}px`,
            }}
            className={cn(
              "z-[130] max-h-64 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10 p-1 animate-in fade-in-0 zoom-in-95 duration-100",
              menuClassName
            )}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                Không có lựa chọn
              </div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(opt)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-[13px] transition-colors cursor-pointer",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      isHighlighted && "bg-muted",
                      isSelected
                        ? "font-semibold text-foreground"
                        : "text-foreground/90 font-normal"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[11px] text-muted-foreground truncate mt-0.5">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
}
