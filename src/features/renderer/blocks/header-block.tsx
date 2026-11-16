import Image from "next/image";
import { renderLnkBioFormattedText } from "@/features/public/components/lnkbio-format";
import { resolveMediaUrl } from "../media";
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

  if (variant === "beacons-portrait" && bannerUrl) {
    return (
      <div className="text-center w-full">
        {/* Ảnh chân dung, mờ dần ở đáy */}
        <div className="relative w-full max-w-[420px] mx-auto aspect-[3.8/5] @min-[40rem]:aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-[#18191c]">
          <Image
            src={bannerUrl}
            alt={displayTitle}
            fill
            className="object-cover"
            unoptimized
            priority={priority}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#101010] via-[#101010]/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101010] to-transparent" />

          <div className="absolute inset-x-0 bottom-2.5 z-10 flex flex-col items-center text-center px-4">
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
              <div className="text-[14.5px] @min-[40rem]:text-[15.5px] leading-[1.5] text-[#FEFEFE] font-medium whitespace-pre-line max-w-[340px] mx-auto">
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
      <div className="text-center w-full">
        <div className="relative w-full aspect-[2.15/1] rounded-2xl overflow-hidden shadow-xs">
          <Image
            src={bannerUrl}
            alt={displayTitle}
            fill
            className="object-cover"
            unoptimized
            priority={priority}
          />
        </div>

        {avatarUrl && (
          <div className="relative -mt-11 @min-[40rem]:-mt-12 mb-2 flex justify-center z-20">
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
          <h1 className="text-[20px] @min-[40rem]:text-[22px] font-bold text-white tracking-wide text-center mt-1">
            {displayTitle}
          </h1>
        )}

        {payload.bio && (
          <div className="mt-3 space-y-2 text-[14px] @min-[40rem]:text-[15px] leading-[1.7] text-neutral-300 text-center max-w-[580px] mx-auto">
            {renderLnkBioFormattedText(payload.bio, "center", accent)}
          </div>
        )}
      </div>
    );
  }

  // Header chuẩn (Lnk.Bio)
  return (
    <div className="text-center w-full">
      {bannerUrl && (
        <div className="relative w-full aspect-2/1 rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={bannerUrl}
            alt={displayTitle}
            fill
            className="object-cover"
            unoptimized
            priority={priority}
          />
        </div>
      )}

      {avatarUrl && (
        <div
          className={`relative w-[90px] h-[90px] @min-[40rem]:w-[96px] @min-[40rem]:h-[96px] mx-auto rounded-full overflow-hidden shadow-2xl z-20 ${
            bannerUrl
              ? "-mt-11 @min-[40rem]:-mt-12 ring-4 ring-black/50 bg-[#161819] mb-2"
              : "ring-1 ring-white/10 mb-3"
          }`}
        >
          <Image
            src={avatarUrl}
            alt={displayTitle}
            fill
            className="object-cover rounded-full"
            unoptimized
            priority={priority}
          />
        </div>
      )}

      {displayTitle && (
        <h1
          className="text-[16px] @min-[40rem]:text-[18px] tracking-[1px] text-center mt-2.5"
          style={HEADING_STYLE}
        >
          {displayTitle}
        </h1>
      )}

      {payload.bio && (
        <div className="mt-4 space-y-3 text-(length:--gp-base-size) leading-[1.6] tracking-[0.5px] text-center max-w-[620px] mx-auto">
          {renderLnkBioFormattedText(payload.bio, "center", accent)}
        </div>
      )}
    </div>
  );
}
