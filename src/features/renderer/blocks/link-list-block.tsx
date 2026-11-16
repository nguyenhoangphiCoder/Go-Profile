import Image from "next/image";
import { resolveMediaUrl } from "../media";
import { MoreDotsIcon, PageLink, pillRadiusClass, splitLabel } from "../primitives";
import type { BlockRenderProps } from "../types";

export function LinkListBlock({ block, ctx }: BlockRenderProps) {
  const links = block.links;
  const { theme, variant } = ctx;

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

              <div className="flex-1 flex flex-col items-center justify-center text-center px-3 min-w-0">
                <span className="text-[15px] @min-[40rem]:text-[16px] font-semibold text-[#FEFEFE] tracking-wide leading-tight line-clamp-1">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[12px] @min-[40rem]:text-[12.5px] text-neutral-300 font-normal leading-tight mt-1 line-clamp-2">
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

              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-w-0">
                <span className="text-[15px] @min-[40rem]:text-[16px] font-semibold text-white tracking-wide truncate max-w-full">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[12.5px] @min-[40rem]:text-[13px] text-neutral-400 font-normal truncate max-w-full mt-0.5">
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

  // Chuẩn Lnk.Bio: nút viên thuốc theo màu thẻ của theme
  const isGrid = (block.payload as { layout?: string }).layout === "grid";
  const isGlass = Boolean(theme.cardBackdropBlur);

  return (
    <div
      className={
        isGrid
          ? "w-full max-w-[620px] mx-auto grid grid-cols-2 gap-3 mt-[21px]"
          : "w-full max-w-[620px] mx-auto space-y-[21px] mt-[21px]"
      }
    >
      {links.map((link) => {
        const iconUrl = resolveMediaUrl(link.mediaUrl);

        return (
          <PageLink
            key={link.id}
            ctx={ctx}
            link={link}
            className={`group relative flex items-center justify-center w-full h-[64px] min-h-[64px] px-4 transition-all duration-200 hover:brightness-110 active:scale-[0.99] shadow-sm select-none ${pillRadiusClass(
              theme.borderRadius
            )} ${isGlass ? "backdrop-blur-xl" : ""}`}
            style={{
              backgroundColor: theme.cardBackground,
              color: theme.cardTextColor,
              border: `1.5px solid ${theme.cardBorderColor || theme.cardBackground}`,
              textDecoration: "none",
              boxShadow: isGlass
                ? "0 6px 20px -2px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.15)"
                : undefined,
            }}
          >
            {iconUrl && (
              <div className="absolute left-[8px] @min-[40rem]:left-[10px] w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
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
              className={`text-[14px] font-bold uppercase tracking-[0.8px] text-center leading-snug group-hover:text-[#1FBBFF] transition-colors duration-150 ${
                iconUrl ? "px-14 @min-[40rem]:px-16" : "px-4"
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
