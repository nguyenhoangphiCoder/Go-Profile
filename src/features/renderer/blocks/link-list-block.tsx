import type { CSSProperties } from "react";
import Image from "next/image";
import { buttonStyle } from "@/config/theme-tokens";
import { readableOn } from "@/lib/color";
import type { LinkButtonColorOverride } from "@/features/pages/types";
import { resolveMediaUrl } from "../media";
import {
  alignItemsClass,
  alignJustifyClass,
  alignTextClass,
  resolveBlockAlign,
} from "../block-frame";
import { parsePhoneTarget } from "../phone-action-sheet";
import { MoreDotsIcon, PageLink, splitLabel, tint } from "../primitives";
import type { BlockRenderProps } from "../types";

export function LinkListBlock({ block, ctx }: BlockRenderProps) {
  const links = block.links;
  const { tokens, variant } = ctx;
  const payload = block.payload as {
    layout?: string;
    zaloByTel?: Record<string, string>;
    buttonColors?: Record<string, LinkButtonColorOverride>;
    rightTextByUrl?: Record<string, string>;
  };
  const zaloByTel = payload.zaloByTel;
  const buttonColors = payload.buttonColors;
  const rightTextByUrl = payload.rightTextByUrl;
  const linkAlign = resolveBlockAlign(block.payload, "center");
  const linkTextAlign = alignTextClass(linkAlign);
  const linkItemsAlign = alignItemsClass(linkAlign);
  const linkJustifyAlign = alignJustifyClass(linkAlign);

  // Bố cục 2 bên (Trái – Phải): tiêu đề bên trái, chữ nhấn (SĐT / phụ đề) bên phải
  if (payload.layout === "split") {
    const baseSurface: CSSProperties =
      variant === "standard"
        ? { backgroundColor: tint(6), borderColor: tint(14) }
        : { backgroundColor: "#202225", borderColor: "rgba(255,255,255,0.12)" };

    return (
      <div className="w-full max-w-(--gp-max-w) mx-auto flex flex-col gap-2.5 mt-(--gp-gap)">
        {links.map((link) => {
          const iconUrl = resolveMediaUrl(link.mediaUrl);
          const { title, subtitle } = splitLabel(link.label);
          const isTel = link.targetUrl?.trim().toLowerCase().startsWith("tel:");
          const customRight = rightTextByUrl?.[link.targetUrl]?.trim();
          const rightText =
            customRight || subtitle || (isTel ? parsePhoneTarget(link.targetUrl).display : "");

          const customColor = buttonColors?.[link.targetUrl];
          const rowStyle: CSSProperties = {
            ...baseSurface,
            ...(customColor?.bg
              ? {
                  backgroundColor: customColor.bg,
                  borderColor: customColor.bg,
                  color: customColor.text || readableOn(customColor.bg),
                }
              : customColor?.text
                ? { color: customColor.text }
                : {}),
          };
          const rightColor =
            customColor?.text ||
            (customColor?.bg ? readableOn(customColor.bg) : "var(--gp-accent)");

          return (
            <PageLink
              key={link.id}
              ctx={ctx}
              link={link}
              zaloTarget={zaloByTel?.[link.targetUrl]}
              className="group relative flex items-center justify-between gap-3 w-full px-4 py-3 rounded-2xl border transition-all duration-150 hover:brightness-110 active:scale-[0.99] select-none text-left"
              style={rowStyle}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {iconUrl && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/15">
                    <Image
                      src={iconUrl}
                      alt={title}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized
                      loading="lazy"
                    />
                  </div>
                )}
                <span
                  className="font-bold leading-snug min-w-0 truncate"
                  style={{
                    fontSize: "var(--gp-body-size, var(--gp-base-size, 14px))",
                    textTransform: "var(--gp-text-case)" as CSSProperties["textTransform"],
                  }}
                >
                  {title}
                </span>
              </div>

              {rightText && (
                <span
                  className="font-bold shrink-0 text-right tabular-nums leading-snug"
                  style={{
                    color: rightColor,
                    fontSize: "calc(var(--gp-body-size, var(--gp-base-size, 14px)) * 0.93)",
                  }}
                >
                  {rightText}
                </span>
              )}
            </PageLink>
          );
        })}
      </div>
    );
  }

  // Beacons Portrait: từng nút viên thuốc viền trắng
  if (variant === "beacons-portrait") {
    return (
      <div className="flex flex-col gap-3.5 w-full">
        {links.map((link) => {
          const iconUrl = resolveMediaUrl(link.mediaUrl);
          const { title, subtitle } = splitLabel(link.label);

          return (
            <PageLink
              key={link.id}
              ctx={ctx}
              link={link}
              zaloTarget={zaloByTel?.[link.targetUrl]}
              className="group relative flex items-center justify-between w-full min-h-[64px] @min-[40rem]:min-h-[66px] px-3.5 py-2 @min-[40rem]:px-4 @min-[40rem]:py-2.5 rounded-full border-2 border-[#FEFEFE] bg-[#1F2125] hover:bg-[#282a2e] transition-all duration-150 text-white select-none shadow-sm active:scale-[0.99]"
            >
              <div className="w-[45px] h-[45px] rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/20">
                {iconUrl && (
                  <Image
                    src={iconUrl}
                    alt={title}
                    width={45}
                    height={45}
                    className="w-full h-full object-cover rounded-full"
                    unoptimized
                    loading="lazy"
                  />
                )}
              </div>

              <div
                className={`flex-1 flex flex-col ${linkItemsAlign} justify-center ${linkTextAlign} px-3 min-w-0`}
              >
                <span
                  className="font-semibold text-[#FEFEFE] tracking-wide leading-tight line-clamp-1"
                  style={{
                    fontSize:
                      "var(--gp-title-size, var(--gp-body-size, calc(var(--gp-base-size, 14px) * 1.07)))",
                  }}
                >
                  {title}
                </span>
                {subtitle && (
                  <span
                    className="text-neutral-300 font-normal leading-tight mt-1 line-clamp-2"
                    style={{
                      fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.86))",
                    }}
                  >
                    {subtitle}
                  </span>
                )}
              </div>

              <div className="w-[36px] flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-white transition-colors">
                <MoreDotsIcon className="w-4 h-4 fill-current" />
              </div>
            </PageLink>
          );
        })}
      </div>
    );
  }

  // Beacons Card: bảng gộp có đường kẻ phân cách
  if (variant === "beacons-card") {
    return (
      <div className="w-full rounded-2xl border border-white/15 bg-[#202225] overflow-hidden divide-y divide-white/10 shadow-sm">
        {links.map((link) => {
          const iconUrl = resolveMediaUrl(link.mediaUrl);
          const { title, subtitle } = splitLabel(link.label);

          return (
            <PageLink
              key={link.id}
              ctx={ctx}
              link={link}
              zaloTarget={zaloByTel?.[link.targetUrl]}
              className="group relative flex items-center justify-between px-4 py-3.5 @min-[40rem]:px-5 @min-[40rem]:py-4 hover:bg-white/5 transition-colors select-none text-white"
            >
              <div className="w-[46px] h-[46px] @min-[40rem]:w-[50px] @min-[40rem]:h-[50px] rounded-[10px] overflow-hidden shrink-0 shadow-xs bg-black/40 flex items-center justify-center">
                {iconUrl && (
                  <Image
                    src={iconUrl}
                    alt={title}
                    width={50}
                    height={50}
                    className="w-full h-full object-cover"
                    unoptimized
                    loading="lazy"
                  />
                )}
              </div>

              <div
                className={`flex-1 flex flex-col ${linkItemsAlign} justify-center ${linkTextAlign} px-4 min-w-0`}
              >
                <span
                  className="font-semibold text-white tracking-wide truncate max-w-full"
                  style={{
                    fontSize:
                      "var(--gp-title-size, var(--gp-body-size, calc(var(--gp-base-size, 14px) * 1.07)))",
                  }}
                >
                  {title}
                </span>
                {subtitle && (
                  <span
                    className="text-neutral-400 font-normal truncate max-w-full mt-0.5"
                    style={{
                      fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 0.88))",
                    }}
                  >
                    {subtitle}
                  </span>
                )}
              </div>

              <div className="shrink-0 text-neutral-400 group-hover:text-white transition-colors w-6 flex justify-end">
                <MoreDotsIcon className="w-4 h-4 fill-current" />
              </div>
            </PageLink>
          );
        })}
      </div>
    );
  }

  // Chuẩn Lnk.Bio: nút theo token (màu thẻ, bo góc, viền, bóng, kiểu nút)
  const isGrid = (block.payload as { layout?: string }).layout === "grid";
  const isGlass = tokens.button.variant === "glass";
  const style = buttonStyle(tokens);

  return (
    <div
      className={
        isGrid
          ? "w-full max-w-(--gp-max-w) mx-auto grid grid-cols-2 gap-3 mt-(--gp-gap)"
          : "w-full max-w-(--gp-max-w) mx-auto flex flex-col gap-(--gp-gap) mt-(--gp-gap)"
      }
    >
      {links.map((link) => {
        const iconUrl = resolveMediaUrl(link.mediaUrl);
        const customColor = buttonColors?.[link.targetUrl];
        const linkStyle: CSSProperties = {
          ...style,
          minHeight: "var(--gp-btn-height, 64px)",
          ...(customColor?.bg
            ? {
                backgroundColor: customColor.bg,
                borderColor: customColor.bg,
                color: customColor.text || readableOn(customColor.bg),
              }
            : customColor?.text
              ? { color: customColor.text }
              : {}),
        };

        return (
          <PageLink
            key={link.id}
            ctx={ctx}
            link={link}
            zaloTarget={zaloByTel?.[link.targetUrl]}
            className={`group relative flex items-center ${linkJustifyAlign} w-full px-4 py-2 transition-all duration-200 hover:brightness-110 active:scale-[0.99] select-none ${
              isGlass && !customColor?.bg ? "backdrop-blur-xl" : ""
            }`}
            style={linkStyle}
          >
            {iconUrl && (
              <div
                className="absolute left-[8px] @min-[40rem]:left-[10px] rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-xs"
                style={{
                  width: "min(48px, calc(var(--gp-btn-height, 64px) - 12px))",
                  height: "min(48px, calc(var(--gp-btn-height, 64px) - 12px))",
                }}
              >
                <Image
                  src={iconUrl}
                  alt={link.label}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-full"
                  unoptimized
                  loading="lazy"
                />
              </div>
            )}
            <span
              style={{
                fontSize: "var(--gp-body-size, var(--gp-base-size, 14px))",
                textTransform: "var(--gp-text-case)" as CSSProperties["textTransform"],
              }}
              className={`font-bold tracking-[0.8px] ${linkTextAlign} leading-snug whitespace-pre-line group-hover:text-[#1FBBFF] transition-colors duration-150 ${
                iconUrl
                  ? linkAlign === "left"
                    ? "pl-14 @min-[40rem]:pl-16 pr-2"
                    : "px-14 @min-[40rem]:px-16"
                  : "px-4"
              }`}
            >
              {link.label}
            </span>
          </PageLink>
        );
      })}
    </div>
  );
}
