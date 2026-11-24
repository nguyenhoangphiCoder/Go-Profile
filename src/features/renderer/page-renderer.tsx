import { Fragment, type CSSProperties, type ReactNode } from "react";
import {
  resolveThemeTokens,
  themeToCssVars,
  type ThemeConfigInput,
  type ThemeTokens,
} from "@/config/theme-tokens";
import { getBlockDefinition } from "./blocks/registry";
import { BlockFrame, readBlockStyle } from "./block-frame";
import "./renderer.css";
import { tint } from "./primitives";
import type { PageKind } from "@/features/pages/types";
import type { PublicBranchItem } from "@/features/branches/types";
import type { RenderBlock, RenderContext, RenderMode } from "./types";

interface PageRendererProps {
  title: string;
  theme: ThemeConfigInput | null | undefined;
  blocks: RenderBlock[];
  mode: RenderMode;
  /** Loại trang: "profile" (1 cột dọc 420-620px) hoặc "landing" (full-width responsive 1200px). */
  pageKind?: PageKind;
  /** Slug hiện tại của trang (dùng cho form đăng ký lead_form gửi về API). */
  currentSlug?: string;
  /** Danh sách chi nhánh cho khối store_locator (nếu trang có sử dụng). */
  branches?: PublicBranchItem[];
  /** Hiển thị nhãn chân trang (mặc định true). */
  showFooterBadge?: boolean;
  /** Nội dung nhãn chân trang (để trống = mặc định GỜ CAFÉ). */
  footerBadgeText?: string | null;
  /** Chỉ ở chế độ preview: khối đang được chọn trong editor (được tô viền). */
  selectedBlockId?: string | null;
  /** Chỉ ở chế độ preview: bấm vào khối để mở form chỉnh sửa tương ứng. */
  onSelectBlock?: (blockId: string) => void;
}

const BEACONS_CARD_BG =
  "radial-gradient(ellipse at 50% 28%, #7e8388 0%, #61656a 45%, #464a4e 80%, #323538 100%)";

/**
 * Bộ render trang dùng chung cho trang công khai và bản xem trước trong editor.
 *
 * - Giao diện lấy từ token v2 (`resolveThemeTokens`), đưa xuống component qua biến CSS `--gp-*`.
 * - Bố cục đáp ứng dùng container query (`@min-[40rem]:` thay cho `sm:`), nên khung xem trước
 *   375px trong editor hiển thị đúng như trên điện thoại thật dù màn hình admin rộng.
 * - Lớp nền cố định nằm ngoài phần tử `@container` vì container query tạo containing block mới,
 *   sẽ làm `position: fixed` bám theo trang thay vì theo màn hình.
 */
export function PageRenderer({
  title,
  theme,
  blocks,
  mode,
  pageKind = "profile",
  currentSlug,
  branches,
  showFooterBadge = true,
  footerBadgeText,
  selectedBlockId,
  onSelectBlock,
}: PageRendererProps) {
  const isLanding = pageKind === "landing";
  const selectable = mode === "preview" && Boolean(onSelectBlock);
  const tokens = resolveThemeTokens(theme);
  const variant = isLanding ? "standard" : tokens.layout;
  const isAnyBeacons = variant !== "standard";
  const ctx: RenderContext = { mode, tokens, variant, pageTitle: title, currentSlug, branches };
  const layerPosition = mode === "public" ? "fixed" : "absolute";

  const rootStyle: CSSProperties = {
    ...themeToCssVars(tokens),
    background:
      variant === "beacons-card"
        ? BEACONS_CARD_BG
        : variant === "beacons-portrait"
          ? "#101010"
          : "var(--gp-bg)",
    color: "var(--gp-text)",
    letterSpacing: isLanding ? "normal" : "0.5px",
    fontFamily: "var(--gp-font-body)",
  };

  const hasFrostedLayer = variant === "standard" && tokens.background.effect !== "none";

  return (
    <div
      className={`${mode === "public" ? "min-h-screen" : "min-h-full"} w-full relative select-none`}
      style={rootStyle}
    >
      {variant === "beacons-portrait" && (
        <div
          className={`${layerPosition} inset-0 z-0 overflow-hidden pointer-events-none`}
          aria-hidden="true"
        >
          <div
            className="absolute -inset-10 bg-cover bg-center filter blur-[60px] sm:blur-[85px] brightness-[0.7] transform scale-115"
            style={{
              backgroundImage: `url(${tokens.background.imageUrl || "/gogang-bg-source.png"})`,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {hasFrostedLayer && (
        <FrostedLayer effect={tokens.background.effect} position={layerPosition} />
      )}

      <div className="@container relative z-10 w-full">
        <div
          className={`w-full flex flex-col items-center justify-start ${
            isLanding
              ? "py-6 @min-[48rem]:py-12 px-4 @min-[48rem]:px-8"
              : isAnyBeacons
                ? "py-4 @min-[40rem]:py-10 px-3 @min-[40rem]:px-4"
                : "py-8 @min-[40rem]:py-14 px-4 @min-[40rem]:px-6"
          }`}
        >
          <main
            className={
              isLanding
                ? "w-full max-w-[1200px] mx-auto flex flex-col gap-6 @min-[48rem]:gap-10"
                : isAnyBeacons
                  ? "w-full max-w-[680px] @min-[40rem]:max-w-[720px] mx-auto bg-[#101010] text-white rounded-[28px] @min-[40rem]:rounded-[36px] p-4 @min-[40rem]:p-7 pb-10 @min-[40rem]:pb-12 border border-white/10 my-4 @min-[40rem]:my-8 relative z-10 flex flex-col gap-6"
                  : "w-full max-w-(--gp-max-w) mx-auto flex flex-col"
            }
            style={
              isAnyBeacons
                ? {
                    boxShadow:
                      "0 0 100px 35px rgba(0, 0, 0, 0.72), 0 30px 80px 15px rgba(0, 0, 0, 0.9)",
                  }
                : undefined
            }
          >
            {blocks.length === 0 && mode === "preview" ? (
              <div className="text-center py-16 opacity-40 text-xs">
                Chưa có khối nội dung nào. Thêm khối ở cột bên trái để bắt đầu.
              </div>
            ) : (
              blocks.map((block, index) => {
                const def = getBlockDefinition(block.type);
                if (!def) return null;
                const { Render } = def;
                const content = (
                  <BlockFrame style={readBlockStyle(block.payload)} index={index}>
                    <Render block={block} ctx={ctx} />
                  </BlockFrame>
                );
                if (!selectable) return <Fragment key={block.id}>{content}</Fragment>;
                return (
                  <SelectableBlock
                    key={block.id}
                    label={def.label}
                    selected={selectedBlockId === block.id}
                    onSelect={() => onSelectBlock!(block.id)}
                  >
                    {content}
                  </SelectableBlock>
                );
              })
            )}
          </main>

          {showFooterBadge &&
            (variant === "beacons-card" ? (
              <footer className="pt-4 pb-4 text-center text-xs opacity-40 select-none relative z-10">
                <span className="tracking-widest uppercase font-medium text-[11px]">
                  {footerBadgeText?.trim() || "GỜ CÀFÊ © 2026"}
                </span>
              </footer>
            ) : (
              <footer className="pt-12 pb-6 text-center text-xs opacity-60">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] tracking-wider font-medium"
                  style={{ backgroundColor: tint(5), borderColor: tint(12) }}
                >
                  <span>{footerBadgeText?.trim() || "GỜ CÀFÊ"}</span>
                </div>
              </footer>
            ))}
        </div>
      </div>
    </div>
  );
}

/** Lớp bao trong bản xem trước: tô viền khi rê chuột / đang chọn, bấm để mở form chỉnh sửa. */
function SelectableBlock({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Chỉnh sửa khối: ${label}`}
      aria-pressed={selected}
      data-block-selectable=""
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group/sel relative cursor-pointer rounded-xl outline-offset-4 transition-[outline-color] focus-visible:outline-2 focus-visible:outline-sky-400 ${
        selected
          ? "outline-2 outline-sky-500"
          : "outline-2 outline-transparent hover:outline-sky-400/60"
      }`}
      style={{ outlineStyle: "solid" }}
    >
      <span
        className={`pointer-events-none absolute -top-2.5 left-2 z-30 px-1.5 py-0.5 rounded-md bg-sky-500 text-white text-[10px] font-semibold tracking-normal normal-case leading-none transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover/sel:opacity-100"
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/** Nền "kính mờ" (các đốm màu nhòe) khi token background.effect khác "none". */
function FrostedLayer({
  effect,
  position,
}: {
  effect: ThemeTokens["background"]["effect"];
  position: "fixed" | "absolute";
}) {
  return (
    <div
      className={`${position} inset-0 z-0 pointer-events-none overflow-hidden`}
      aria-hidden="true"
    >
      {effect === "frosted-warm" ? (
        <>
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-600/30 blur-[70px]" />
          <div className="absolute top-[35%] -left-[10%] w-60 h-60 rounded-full bg-yellow-700/25 blur-[70px]" />
          <div className="absolute top-[50%] -right-[10%] w-64 h-64 rounded-full bg-amber-500/25 blur-[70px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-72 h-72 rounded-full bg-stone-900/70 blur-[80px]" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/60" />
        </>
      ) : effect === "frosted-light" ? (
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
  );
}
