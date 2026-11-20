import Image from "next/image";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import { isOptimizableImageUrl, resolveMediaUrl } from "../media";
import {
  alignItemsClass,
  alignJustifyClass,
  alignTextClass,
  resolveBlockAlign,
} from "../block-frame";
import type { BlockRenderProps } from "../types";
import { HEADING_STYLE } from "../primitives";

export function HeaderBlock({ block, ctx }: BlockRenderProps) {
  const payload = block.payload as {
    title?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  };
  const { variant } = ctx;
  const accent = "var(--gp-accent)";
  const displayTitle = payload.title || ctx.pageTitle || "";
  const avatarUrl = resolveMediaUrl(payload.avatarUrl);
  const bannerUrl = resolveMediaUrl(payload.bannerUrl);
  const priority = ctx.mode === "public";
  const align = resolveBlockAlign(block.payload, "center");
  const textAlign = alignTextClass(align);
  const itemsAlign = alignItemsClass(align);
  const justifyAlign = alignJustifyClass(align);
  const boxMargin = align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

  if (variant === "beacons-portrait" && bannerUrl) {
    return (
      <div className="text-center w-full">
        {/* Ảnh chân dung, mờ dần ở đáy */}
        <div className="relative w-full max-w-[420px] mx-auto aspect-[3.8/5] @min-[40rem]:aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-[#18191c]">
          <Image
            src={bannerUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 100vw, 620px"
            className="object-cover"
            unoptimized={!isOptimizableImageUrl(bannerUrl)}
            priority={priority}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#101010] via-[#101010]/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101010] to-transparent" />

          <div
            className={`absolute inset-x-0 bottom-2.5 z-10 flex flex-col ${itemsAlign} ${textAlign} px-4`}
          >
            {avatarUrl && (
              <div className="w-[78px] h-[78px] @min-[40rem]:w-[82px] @min-[40rem]:h-[82px] rounded-full overflow-hidden mb-2 shadow-md bg-black">
                <Image
                  src={avatarUrl}
                  alt={displayTitle}
                  width={82}
                  height={82}
                  className="w-full h-full object-contain"
                  unoptimized
                  priority={priority}
                />
              </div>
            )}

            {payload.bio && (
              <div
                className={`leading-[1.5] text-[#FEFEFE] font-medium whitespace-pre-line max-w-[340px] ${boxMargin} ${textAlign}`}
                style={{ fontSize: "var(--gp-body-size, calc(var(--gp-base-size, 14px) * 1.04))" }}
              >
                {payload.bio}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "beacons-card" && bannerUrl) {
    return (
      <div className={`${textAlign} w-full`}>
        <div className="relative w-full aspect-[2.15/1] rounded-2xl overflow-hidden shadow-xs">
          <Image
            src={bannerUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 100vw, 620px"
            className="object-cover"
            unoptimized={!isOptimizableImageUrl(bannerUrl)}
            priority={priority}
          />
        </div>

        {avatarUrl && (
          <div className={`relative -mt-11 @min-[40rem]:-mt-12 mb-2 flex ${justifyAlign} z-20`}>
            <div className="w-[94px] h-[94px] @min-[40rem]:w-[102px] @min-[40rem]:h-[102px] rounded-full overflow-hidden shadow-2xl ring-4 ring-[#101113] bg-[#101113]">
              <Image
                src={avatarUrl}
                alt={displayTitle}
                width={102}
                height={102}
                className="w-full h-full object-cover rounded-full"
                unoptimized
                priority={priority}
              />
            </div>
          </div>
        )}

        {displayTitle && (
          <h1
            className={`font-bold text-white tracking-wide ${textAlign} mt-1`}
            style={{
              fontFamily: "var(--gp-font-heading)",
              fontSize: "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.45))",
            }}
          >
            {displayTitle}
          </h1>
        )}

        {payload.bio && (
          <div
            className={`mt-3 space-y-2 leading-[1.7] text-neutral-300 ${textAlign} max-w-[580px] ${boxMargin}`}
            style={{ fontSize: "var(--gp-body-size, var(--gp-base-size, 14px))" }}
          >
            {renderLnkBioFormattedText(payload.bio, align, accent)}
          </div>
        )}
      </div>
    );
  }

  // Header chuẩn (Lnk.Bio)
  return (
    <div className={`${textAlign} w-full`}>
      {bannerUrl && (
        <div className="relative w-full aspect-2/1 rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={bannerUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 100vw, 620px"
            className="object-cover"
            unoptimized={!isOptimizableImageUrl(bannerUrl)}
            priority={priority}
          />
        </div>
      )}

      {avatarUrl && (
        <div
          className={`relative w-[90px] h-[90px] @min-[40rem]:w-[96px] @min-[40rem]:h-[96px] ${boxMargin} rounded-full overflow-hidden shadow-2xl z-20 ${
            bannerUrl
              ? "-mt-11 @min-[40rem]:-mt-12 ring-4 ring-black/50 bg-[#161819] mb-2"
              : "ring-1 ring-white/10 mb-3"
          }`}
        >
          <Image
            src={avatarUrl}
            alt={displayTitle}
            fill
            sizes="96px"
            className="object-cover rounded-full"
            unoptimized={!isOptimizableImageUrl(avatarUrl)}
            priority={priority}
          />
        </div>
      )}

      {displayTitle && (
        <h1
          className={`tracking-[1px] ${textAlign} mt-2.5`}
          style={{
            ...HEADING_STYLE,
            fontSize: "var(--gp-title-size, calc(var(--gp-base-size, 14px) * 1.2))",
          }}
        >
          {displayTitle}
        </h1>
      )}

      {payload.bio && (
        <div
          className={`mt-4 space-y-3 leading-[1.6] tracking-[0.5px] ${textAlign} max-w-[620px] ${boxMargin}`}
          style={{ fontSize: "var(--gp-body-size, var(--gp-base-size, 14px))" }}
        >
          {renderLnkBioFormattedText(payload.bio, align, accent)}
        </div>
      )}
    </div>
  );
}
