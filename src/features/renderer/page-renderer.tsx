import type { CSSProperties } from "react";
import { resolveTheme, type ThemePreset } from "@/config/themes";
import type { PageThemeConfig } from "@/features/pages/types";
import { getBlockDefinition } from "./blocks/registry";
import type { LayoutVariant, RenderBlock, RenderContext, RenderMode } from "./types";

interface PageRendererProps {
  title: string;
  theme: PageThemeConfig | null | undefined;
  blocks: RenderBlock[];
  mode: RenderMode;
}

export function getLayoutVariant(theme: ThemePreset): LayoutVariant {
  if (theme.id === "beacons-dark-card") return "beacons-card";
  if (theme.id === "beacons-portrait-card") return "beacons-portrait";
  return "standard";
}

function rootBackground(theme: ThemePreset, variant: LayoutVariant): string {
  if (variant === "beacons-card") {
    return "radial-gradient(ellipse at 50% 28%, #7e8388 0%, #61656a 45%, #464a4e 80%, #323538 100%)";
  }
  if (variant === "beacons-portrait") return "#101010";
  return theme.backgroundGradient || theme.backgroundColor || "#171919";
}

/**
 * Bộ render trang dùng chung cho trang công khai và bản xem trước trong editor.
 *
 * Bố cục đáp ứng dùng container query (`@min-[40rem]:` thay cho `sm:`), nên khung xem trước
 * 375px trong editor hiển thị đúng như trên điện thoại thật dù màn hình admin rộng.
 * Lớp nền cố định nằm ngoài phần tử `@container` vì container query tạo containing block mới,
 * sẽ làm `position: fixed` bám theo trang thay vì theo màn hình.
 */
export function PageRenderer({ title, theme: themeConfig, blocks, mode }: PageRendererProps) {
  const theme = resolveTheme(themeConfig);
  const variant = getLayoutVariant(theme);
  const isAnyBeacons = variant !== "standard";
  const ctx: RenderContext = { mode, theme, variant, pageTitle: title };
  const layerPosition = mode === "public" ? "fixed" : "absolute";

  const rootStyle: CSSProperties = {
    background: rootBackground(theme, variant),
    color: theme.textColor || "#CBD0D5",
    letterSpacing: "0.5px",
    fontFamily:
      theme.fontFamily === "inter"
        ? "var(--font-inter), sans-serif"
        : "var(--font-be-vietnam-pro), sans-serif",
  };

  const hasFrostedLayer =
    variant === "standard" && Boolean(theme.backgroundBlur || theme.backgroundVariant);

  return (
    <div
      className={`${mode === "public" ? "min-h-screen" : "min-h-full"} w-full relative select-none font-sans`}
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
              backgroundImage: `url(${theme.backgroundImage || "/gogang-bg-source.png"})`,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {hasFrostedLayer && <FrostedLayer theme={theme} position={layerPosition} />}

      <div className="@container relative z-10 w-full">
        <div
          className={`w-full flex flex-col items-center justify-start ${
            isAnyBeacons
              ? "py-4 @min-[40rem]:py-10 px-3 @min-[40rem]:px-4"
              : "py-8 @min-[40rem]:py-14 px-4 @min-[40rem]:px-6"
          }`}
        >
          <main
            className={
              isAnyBeacons
                ? "w-full max-w-[680px] @min-[40rem]:max-w-[720px] mx-auto bg-[#101010] text-white rounded-[28px] @min-[40rem]:rounded-[36px] p-4 @min-[40rem]:p-7 pb-10 @min-[40rem]:pb-12 border border-white/10 my-4 @min-[40rem]:my-8 relative z-10 flex flex-col gap-6"
                : "w-full max-w-[620px] mx-auto flex flex-col"
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
              blocks.map((block) => {
                const def = getBlockDefinition(block.type);
                if (!def) return null;
                const { Render } = def;
                return <Render key={block.id} block={block} ctx={ctx} />;
              })
            )}
          </main>

          {variant === "beacons-card" ? (
            <footer className="pt-4 pb-4 text-center text-xs opacity-40 select-none relative z-10">
              <span className="tracking-widest uppercase font-medium text-[11px]">
                GỜ CAFÉ © 2026
              </span>
            </footer>
          ) : (
            <footer className="pt-12 pb-6 text-center text-xs opacity-60">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] tracking-wider font-medium">
                <span>GỜ CAFÉ</span>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

/** Nền "kính mờ" (các đốm màu nhòe) khi theme bật backgroundBlur / backgroundVariant. */
function FrostedLayer({ theme, position }: { theme: ThemePreset; position: "fixed" | "absolute" }) {
  return (
    <div
      className={`${position} inset-0 z-0 pointer-events-none overflow-hidden`}
      aria-hidden="true"
    >
      {theme.backgroundVariant === "frosted-warm" ? (
        <>
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-600/30 blur-[70px]" />
          <div className="absolute top-[35%] -left-[10%] w-60 h-60 rounded-full bg-yellow-700/25 blur-[70px]" />
          <div className="absolute top-[50%] -right-[10%] w-64 h-64 rounded-full bg-amber-500/25 blur-[70px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-72 h-72 rounded-full bg-stone-900/70 blur-[80px]" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/60" />
        </>
      ) : theme.backgroundVariant === "frosted-light" ? (
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
