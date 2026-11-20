"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Select } from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import { FONT_IDS, FONT_LABELS, FONT_STACKS, type FontId } from "@/config/theme-tokens";
import { countRichTextStats, sanitizeRichTextHtml, toEditorHtml } from "@/lib/rich-text";

export interface RichTextEditorProps {
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
}

const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 18, 20, 24, 28, 32] as const;

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  align: "left" | "center" | "right";
}

const EMPTY_FORMAT: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  align: "left",
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  minHeight = 128,
  ariaLabel = "Trình soạn thảo văn bản",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastEmittedRef = useRef<string | null>(null);

  const [selectedColor, setSelectedColor] = useState("#A16236");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [format, setFormat] = useState<FormatState>(EMPTY_FORMAT);
  const [isEmpty, setIsEmpty] = useState(() => countRichTextStats(value).chars === 0);

  // Đồng bộ giá trị từ bên ngoài (lần đầu mount, hoặc khi Undo/Redo ở PageEditor)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (lastEmittedRef.current === value) return;
    const html = toEditorHtml(value);
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
    lastEmittedRef.current = value;
    setIsEmpty(countRichTextStats(value).chars === 0);
  }, [value]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    const el = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !el) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const saved = savedRangeRef.current;
    if (!saved) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(saved);
  }, []);

  const refreshFormatState = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
    saveSelection();
    try {
      const align = document.queryCommandState("justifyCenter")
        ? "center"
        : document.queryCommandState("justifyRight")
          ? "right"
          : "left";
      setFormat({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        align,
      });
    } catch {
      // Một số môi trường (jsdom) không hỗ trợ queryCommandState
    }
  }, [saveSelection]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const stats = countRichTextStats(el.innerHTML);
    setIsEmpty(stats.chars === 0);
    const cleaned = stats.chars === 0 ? "" : sanitizeRichTextHtml(el.innerHTML);
    lastEmittedRef.current = cleaned;
    onChange(cleaned);
  }, [onChange]);

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      restoreSelection();
      try {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand(command, false, commandValue);
      } catch {
        // Bỏ qua nếu trình duyệt không hỗ trợ
      }
      emitChange();
      refreshFormatState();
    },
    [restoreSelection, emitChange, refreshFormatState]
  );

  /** Bọc vùng chọn hiện tại bằng <span> với style inline (dùng cho font-size & font-family). */
  const applyInlineStyle = useCallback(
    (cssProp: "fontSize" | "fontFamily", cssVal: string) => {
      restoreSelection();
      const sel = window.getSelection();
      const el = editorRef.current;
      if (!sel || sel.rangeCount === 0 || !el) return;
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return;

      if (range.collapsed) {
        // Không bôi đen chữ nào -> chọn toàn bộ nội dung trong editor nếu có, hoặc chèn span
        const span = document.createElement("span");
        span.style[cssProp] = cssVal;
        span.innerHTML = "\u200B";
        range.insertNode(span);
        const nextRange = document.createRange();
        nextRange.setStart(span.firstChild!, 1);
        nextRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nextRange);
      } else {
        const span = document.createElement("span");
        span.style[cssProp] = cssVal;
        try {
          span.appendChild(range.extractContents());
          range.insertNode(span);
          const nextRange = document.createRange();
          nextRange.selectNodeContents(span);
          sel.removeAllRanges();
          sel.addRange(nextRange);
          savedRangeRef.current = nextRange.cloneRange();
        } catch {
          // Fallback nếu vùng chọn cắt ngang nhiều phần tử phức tạp
        }
      }
      emitChange();
    },
    [restoreSelection, emitChange]
  );

  const handleInsertLink = () => {
    saveSelection();
    const raw = window.prompt("Nhập đường dẫn (https://..., mailto:..., tel:...):", "https://");
    if (!raw) return;
    const trimmed = raw.trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
      window.alert("Liên kết phải bắt đầu bằng https://, http://, mailto: hoặc tel:");
      return;
    }
    exec("createLink", trimmed);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plain = e.clipboardData.getData("text/plain");
    if (!plain) return;
    try {
      document.execCommand("insertText", false, plain);
    } catch {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(plain));
      }
    }
    emitChange();
  };

  const stats = countRichTextStats(value);

  const toolbarBtn = (active?: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
      active
        ? "bg-primary/15 text-primary font-bold"
        : "text-foreground/80 hover:text-foreground hover:bg-muted"
    }`;

  return (
    <div className="rounded-2xl border border-input bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border/80 bg-muted/30">
        {/* Font family */}
        <Select
          size="xs"
          ariaLabel="Chọn font chữ"
          value={selectedFont}
          onTriggerMouseDown={saveSelection}
          onChange={(val) => {
            const id = val as FontId | "";
            setSelectedFont(id);
            if (id) applyInlineStyle("fontFamily", FONT_STACKS[id]);
          }}
          options={[
            { value: "", label: "Font chữ" },
            ...FONT_IDS.map((id) => ({
              value: id,
              label: FONT_LABELS[id].split(" (")[0],
            })),
          ]}
          className="w-[118px]"
        />

        {/* Font size */}
        <Select
          size="xs"
          ariaLabel="Chọn cỡ chữ"
          value={selectedSize}
          onTriggerMouseDown={saveSelection}
          onChange={(size) => {
            setSelectedSize(size);
            if (size) applyInlineStyle("fontSize", `${size}px`);
          }}
          options={[
            { value: "", label: "Cỡ" },
            ...FONT_SIZE_OPTIONS.map((sz) => ({
              value: String(sz),
              label: String(sz),
            })),
          ]}
          className="w-[62px]"
        />

        <span className="w-px h-4 bg-border/80 mx-0.5" aria-hidden="true" />

        {/* B / I / U / S */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className={toolbarBtn(format.bold)}
          title="In đậm (Ctrl+B)"
          aria-label="In đậm"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className={toolbarBtn(format.italic)}
          title="In nghiêng (Ctrl+I)"
          aria-label="In nghiêng"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
          className={toolbarBtn(format.underline)}
          title="Gạch chân (Ctrl+U)"
          aria-label="Gạch chân"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("strikeThrough")}
          className={toolbarBtn(format.strike)}
          title="Gạch ngang"
          aria-label="Gạch ngang"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-border/80 mx-0.5" aria-hidden="true" />

        {/* Text color & clear format */}
        <label
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted cursor-pointer shrink-0"
          title="Màu chữ"
          onMouseDown={saveSelection}
        >
          <span
            className="w-4 h-4 rounded-sm border border-border shadow-2xs block"
            style={{ backgroundColor: selectedColor }}
          />
          <input
            type="color"
            aria-label="Màu chữ"
            value={selectedColor}
            onChange={(e) => {
              const color = e.target.value;
              setSelectedColor(color);
              exec("foreColor", color);
            }}
            className="sr-only"
          />
        </label>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            exec("removeFormat");
            setSelectedFont("");
            setSelectedSize("");
          }}
          className={toolbarBtn(false)}
          title="Xoá định dạng chữ"
          aria-label="Xoá định dạng"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-border/80 mx-0.5" aria-hidden="true" />

        {/* Alignment */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("justifyLeft")}
          className={toolbarBtn(format.align === "left")}
          title="Căn trái"
          aria-label="Căn trái"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("justifyCenter")}
          className={toolbarBtn(format.align === "center")}
          title="Căn giữa"
          aria-label="Căn giữa"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("justifyRight")}
          className={toolbarBtn(format.align === "right")}
          title="Căn phải"
          aria-label="Căn phải"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-border/80 mx-0.5" aria-hidden="true" />

        {/* Lists & Link */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertUnorderedList")}
          className={toolbarBtn(format.ul)}
          title="Danh sách dấu chấm"
          aria-label="Danh sách dấu chấm"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("insertOrderedList")}
          className={toolbarBtn(format.ol)}
          title="Danh sách đánh số"
          aria-label="Danh sách đánh số"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertLink}
          className={toolbarBtn(false)}
          title="Chèn liên kết"
          aria-label="Chèn liên kết"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-border/80 mx-0.5" aria-hidden="true" />

        {/* Undo / Redo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("undo")}
          className={toolbarBtn(false)}
          title="Hoàn tác"
          aria-label="Hoàn tác soạn thảo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("redo")}
          className={toolbarBtn(false)}
          title="Làm lại"
          aria-label="Làm lại soạn thảo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div className="relative bg-background">
        {isEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3.5 right-3.5 text-xs text-muted-foreground/60 select-none"
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          onInput={emitChange}
          onKeyUp={refreshFormatState}
          onMouseUp={refreshFormatState}
          onBlur={saveSelection}
          onPaste={handlePaste}
          style={{ minHeight: `${minHeight}px` }}
          className="gp-rich-text w-full px-3.5 py-3 text-xs leading-relaxed text-foreground focus:outline-none select-text"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-t border-border/70 bg-muted/20 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {stats.words} từ • {stats.chars} ký tự
        </span>
        <span className="hidden sm:inline">Chỉnh sửa trực tiếp • Hỗ trợ Ctrl+B / I / U</span>
      </div>
    </div>
  );
}
