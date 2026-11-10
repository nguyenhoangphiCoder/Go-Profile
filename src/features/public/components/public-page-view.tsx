import Image from "next/image";
import { resolveTheme } from "@/config/themes";
import { renderLnkBioFormattedText } from "./lnkbio-format";
import { resolveSmartIcon } from "./brand-icons";
import type { PublicPageDTO } from "../types";

interface PublicPageViewProps {
  page: PublicPageDTO;
}

function resolveMediaUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("/")
  ) {
    return pathOrUrl;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/public_media/${pathOrUrl}`;
}

export function PublicPageView({ page }: PublicPageViewProps) {
  const blocks = (page.blocks || []).slice().sort((a, b) => a.position - b.position);
  const theme = resolveTheme(page.theme);
  const isBeaconsCard = theme.id === "beacons-dark-card";
  const isBeaconsPortrait = theme.id === "beacons-portrait-card";
  const isAnyBeacons = isBeaconsCard || isBeaconsPortrait;

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-start relative select-none font-sans ${
        isAnyBeacons ? "py-4 sm:py-10 px-3 sm:px-4" : "py-8 sm:py-14 px-4 sm:px-6"
      }`}
      style={{
        background: isBeaconsCard
          ? "radial-gradient(ellipse at 50% 28%, #7e8388 0%, #61656a 45%, #464a4e 80%, #323538 100%)"
          : isBeaconsPortrait
          ? "#101010"
          : theme.backgroundGradient || theme.backgroundColor || "#171919",
        color: theme.textColor || "#CBD0D5",
        letterSpacing: "0.5px",
        fontFamily:
          theme.fontFamily === "inter"
            ? "var(--font-inter), sans-serif"
            : "var(--font-be-vietnam-pro), sans-serif",
      }}
    >
      {/* Blurred background photo for Beacons Portrait theme */}
      {isBeaconsPortrait && (
        <div
          className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
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

      {/* Main Container */}
      <main
        className={
          isAnyBeacons
            ? "w-full max-w-[680px] sm:max-w-[720px] mx-auto bg-[#101010] text-white rounded-[28px] sm:rounded-[36px] p-4 sm:p-7 pb-10 sm:pb-12 border border-white/10 my-4 sm:my-8 relative z-10 flex flex-col gap-6"
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
        {blocks.map((block) => {
          switch (block.type) {
            case "header": {
              const payload = (block.payload || {}) as {
                title?: string;
                bio?: string;
                avatarUrl?: string;
                bannerUrl?: string;
              };
              const displayTitle = payload.title || page.title || "";
              const avatarUrl = resolveMediaUrl(payload.avatarUrl);
              const bannerUrl = resolveMediaUrl(payload.bannerUrl);

              if (isBeaconsPortrait && bannerUrl) {
                return (
                  <div key={block.block_id} className="text-center w-full">
                    {/* Portrait banner photo with bottom gradient fade */}
                    <div className="relative w-full max-w-[420px] mx-auto aspect-[3.8/5] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-[#18191c]">
                      <Image
                        src={bannerUrl}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                      />

                      {/* Gradient fades at bottom of photo matching Beacons */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#101010] via-[#101010]/80 to-transparent" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101010] to-transparent" />

                      {/* Overlay content on bottom of portrait photo */}
                      <div className="absolute inset-x-0 bottom-2.5 z-10 flex flex-col items-center text-center px-4">
                        {avatarUrl && (
                          <div className="w-[78px] h-[78px] sm:w-[82px] sm:h-[82px] rounded-full overflow-hidden mb-2 shadow-md bg-black">
                            <Image
                              src={avatarUrl}
                              alt={displayTitle}
                              width={82}
                              height={82}
                              className="w-full h-full object-contain"
                              unoptimized
                              priority
                            />
                          </div>
                        )}

                        {payload.bio && (
                          <div className="text-[14.5px] sm:text-[15.5px] leading-[1.5] text-[#FEFEFE] font-medium whitespace-pre-line max-w-[340px] mx-auto">
                            {payload.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (isBeaconsCard && bannerUrl) {
                return (
                  <div key={block.block_id} className="text-center w-full">
                    {/* Inset rounded banner inside card with padding around it */}
                    <div className="relative w-full aspect-[2.15/1] rounded-2xl overflow-hidden shadow-xs">
                      <Image
                        src={bannerUrl}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </div>

                    {/* Overlapping avatar */}
                    {avatarUrl && (
                      <div className="relative -mt-11 sm:-mt-12 mb-2 flex justify-center z-20">
                        <div className="w-[94px] h-[94px] sm:w-[102px] sm:h-[102px] rounded-full overflow-hidden shadow-2xl ring-4 ring-[#101113] bg-[#101113]">
                          <Image
                            src={avatarUrl}
                            alt={displayTitle}
                            width={102}
                            height={102}
                            className="w-full h-full object-cover rounded-full"
                            unoptimized
                            priority
                          />
                        </div>
                      </div>
                    )}

                    {displayTitle && (
                      <h1 className="text-[20px] sm:text-[22px] font-bold text-white tracking-wide text-center mt-1">
                        {displayTitle}
                      </h1>
                    )}

                    {payload.bio && (
                      <div className="mt-3 space-y-2 text-[14px] sm:text-[15px] leading-[1.7] text-neutral-300 text-center max-w-[580px] mx-auto">
                        {renderLnkBioFormattedText(payload.bio, "center", theme.accentColor)}
                      </div>
                    )}
                  </div>
                );
              }

              // Standard header (Lnk.Bio)
              return (
                <div key={block.block_id} className="text-center w-full">
                  {bannerUrl && (
                    <div className="relative w-full aspect-2/1 rounded-2xl overflow-hidden shadow-lg mb-4">
                      <Image
                        src={bannerUrl}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </div>
                  )}

                  {avatarUrl && (
                    <div className="relative w-[90px] h-[90px] mx-auto rounded-full overflow-hidden shadow-2xl ring-1 ring-white/10 mb-3">
                      <Image
                        src={avatarUrl}
                        alt={displayTitle}
                        fill
                        className="object-cover rounded-full"
                        unoptimized
                        priority
                      />
                    </div>
                  )}

                  {displayTitle && (
                    <h1
                      className="text-[16px] sm:text-[18px] font-bold uppercase tracking-[1px] text-center mt-2.5"
                      style={{ color: theme.textColor }}
                    >
                      {displayTitle}
                    </h1>
                  )}

                  {payload.bio && (
                    <div className="mt-4 space-y-3 text-[14px] leading-[1.6] tracking-[0.5px] text-center max-w-[620px] mx-auto">
                      {renderLnkBioFormattedText(payload.bio, "center", theme.accentColor)}
                    </div>
                  )}
                </div>
              );
            }

            case "social_icons": {
              const links = block.links || [];
              if (links.length === 0) return null;

              if (isAnyBeacons) {
                return (
                  <div
                    key={block.block_id}
                    className="flex items-center justify-center gap-6 my-1"
                  >
                    {links.map((link) => {
                      const href = `/r/${link.page_link_id}`;

                      return (
                        <a
                          key={link.page_link_id}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-neutral-300 transition-all hover:scale-110 active:scale-95"
                          title={link.label}
                        >
                          {resolveSmartIcon(link.target_url, link.label, "social", "w-5 h-5")}
                        </a>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div
                  key={block.block_id}
                  className="flex items-center justify-center gap-3.5 my-1 flex-wrap"
                >
                  {links.map((link) => {
                    const iconUrl = resolveMediaUrl(link.media_url);
                    const href = `/r/${link.page_link_id}`;

                    return (
                      <a
                        key={link.page_link_id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40 transition-all text-white active:scale-95 shadow-sm"
                        title={link.label}
                      >
                        {iconUrl ? (
                          <div className="relative w-5 h-5 rounded-full overflow-hidden">
                            <Image
                              src={iconUrl}
                              alt={link.label}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          resolveSmartIcon(link.target_url, link.label, "social", "w-5 h-5")
                        )}
                      </a>
                    );
                  })}
                </div>
              );
            }

            case "heading": {
              const payload = (block.payload || {}) as {
                text?: string;
                level?: number;
              };
              const level = payload.level || 1;

              return (
                <div
                  key={block.block_id}
                  className={
                    isBeaconsCard
                      ? "mt-2 mb-1 text-center w-full"
                      : "mt-[28px] mb-[6px] text-center w-full"
                  }
                >
                  {level === 1 ? (
                    <h2
                      className={`font-bold uppercase tracking-[0.5px] ${
                        isBeaconsCard
                          ? "text-[14px] sm:text-[15px] text-white leading-snug whitespace-pre-line"
                          : "text-[16px] sm:text-[18px]"
                      }`}
                      style={{ color: isBeaconsCard ? "#FFFFFF" : theme.textColor }}
                    >
                      {payload.text}
                    </h2>
                  ) : level === 2 ? (
                    <h3
                      className={`font-bold uppercase tracking-[0.5px] ${
                        isBeaconsCard
                          ? "text-[14px] sm:text-[15px] text-white leading-snug whitespace-pre-line"
                          : "text-[15px] sm:text-[17px]"
                      }`}
                      style={{ color: isBeaconsCard ? "#FFFFFF" : theme.textColor }}
                    >
                      {payload.text}
                    </h3>
                  ) : (
                    <h4
                      className={`font-bold uppercase tracking-[0.5px] ${
                        isBeaconsCard
                          ? "text-[13px] sm:text-[14px] text-white leading-snug whitespace-pre-line"
                          : "text-[13px] sm:text-[15px]"
                      }`}
                      style={{ color: isBeaconsCard ? "#FFFFFF" : theme.textColor }}
                    >
                      {payload.text}
                    </h4>
                  )}
                </div>
              );
            }

            case "text": {
              const payload = (block.payload || {}) as {
                content?: string;
                align?: string;
              };

              return (
                <div
                  key={block.block_id}
                  className={
                    isBeaconsCard
                      ? "space-y-3 text-[13px] sm:text-[14px] leading-[1.65] w-full text-neutral-300"
                      : "mt-[14px] space-y-2 text-[14px] leading-[1.6] tracking-[0.5px] w-full max-w-[620px] mx-auto"
                  }
                >
                  {renderLnkBioFormattedText(
                    payload.content || "",
                    payload.align || (isBeaconsCard ? "left" : "center"),
                    theme.accentColor
                  )}
                </div>
              );
            }

            case "link_list": {
              const links = block.links || [];

              // Beacons Portrait individual pill buttons with crisp white outline
              if (isBeaconsPortrait) {
                return (
                  <div key={block.block_id} className="flex flex-col gap-3.5 w-full">
                    {links.map((link) => {
                      const iconUrl = resolveMediaUrl(link.media_url);
                      const [titlePart, ...subParts] = (link.label || "").split("\n");
                      const subtitle = subParts.join(" ").trim();
                      const href = `/r/${link.page_link_id}`;

                      return (
                        <a
                          key={link.page_link_id}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex items-center justify-between w-full min-h-[64px] sm:min-h-[66px] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full border-2 border-[#FEFEFE] bg-[#1F2125] hover:bg-[#282a2e] transition-all duration-150 text-white select-none shadow-sm active:scale-[0.99]"
                        >
                          {/* Left circular icon */}
                          <div className="w-[45px] h-[45px] rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/20">
                            {iconUrl && (
                              <Image
                                src={iconUrl}
                                alt={titlePart}
                                width={45}
                                height={45}
                                className="w-full h-full object-cover rounded-full"
                                unoptimized
                              />
                            )}
                          </div>

                          {/* Center Title & Subtitle */}
                          <div className="flex-1 flex flex-col items-center justify-center text-center px-3 min-w-0">
                            <span className="text-[15px] sm:text-[16px] font-semibold text-[#FEFEFE] tracking-wide leading-tight line-clamp-1">
                              {titlePart}
                            </span>
                            {subtitle && (
                              <span className="text-[12px] sm:text-[12.5px] text-neutral-300 font-normal leading-tight mt-1 line-clamp-2">
                                {subtitle}
                              </span>
                            )}
                          </div>

                          {/* Right vertical 3 dots */}
                          <div className="w-[36px] flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-white transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }

              // Beacons grouped table layout with dividers
              if (isBeaconsCard) {
                return (
                  <div
                    key={block.block_id}
                    className="w-full rounded-2xl border border-white/15 bg-[#202225] overflow-hidden divide-y divide-white/10 shadow-sm"
                  >
                    {links.map((link) => {
                      const iconUrl = resolveMediaUrl(link.media_url);
                      const [titlePart, ...subParts] = (link.label || "").split("\n");
                      const subtitle = subParts.join(" ").trim();
                      const href = `/r/${link.page_link_id}`;

                      return (
                        <a
                          key={link.page_link_id}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-white/5 transition-colors select-none text-white"
                        >
                          {/* Left app icon */}
                          <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-[10px] overflow-hidden shrink-0 shadow-xs bg-black/40 flex items-center justify-center">
                            {iconUrl && (
                              <Image
                                src={iconUrl}
                                alt={titlePart}
                                width={50}
                                height={50}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            )}
                          </div>

                          {/* Center Title and Subtitle */}
                          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-w-0">
                            <span className="text-[15px] sm:text-[16px] font-semibold text-white tracking-wide truncate max-w-full">
                              {titlePart}
                            </span>
                            {subtitle && (
                              <span className="text-[12.5px] sm:text-[13px] text-neutral-400 font-normal truncate max-w-full mt-0.5">
                                {subtitle}
                              </span>
                            )}
                          </div>

                          {/* Right vertical 3 dots */}
                          <div className="shrink-0 text-neutral-400 group-hover:text-white transition-colors w-6 flex justify-end">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }

              // Standard Lnk.Bio pill layout
              return (
                <div
                  key={block.block_id}
                  className="w-full max-w-[620px] mx-auto space-y-[21px] mt-[21px]"
                >
                  {links.map((link) => {
                    const iconUrl = resolveMediaUrl(link.media_url);
                    const label = link.label;
                    const href = `/r/${link.page_link_id}`;

                    return (
                      <a
                        key={link.page_link_id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-center w-full h-[64px] min-h-[64px] px-4 rounded-full transition-all duration-200 hover:brightness-110 active:scale-[0.99] shadow-sm select-none"
                        style={{
                          backgroundColor: theme.cardBackground,
                          color: theme.cardTextColor,
                          border: `1.5px solid ${theme.cardBorderColor || theme.cardBackground}`,
                          textDecoration: "none",
                        }}
                      >
                        {iconUrl && (
                          <div className="absolute left-[8px] sm:left-[10px] w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                            <Image
                              src={iconUrl}
                              alt={label}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        )}
                        <span
                          className={`text-[14px] font-bold uppercase tracking-[0.8px] text-center leading-snug group-hover:text-[#1FBBFF] transition-colors duration-150 ${
                            iconUrl ? "px-14 sm:px-16" : "px-4"
                          }`}
                        >
                          {label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              );
            }

            case "image": {
              const payload = (block.payload || {}) as {
                url?: string;
                imageUrl?: string;
                alt?: string;
                caption?: string;
              };
              const imgUrl = resolveMediaUrl(payload.imageUrl || payload.url);

              if (!imgUrl) return null;

              return (
                <div key={block.block_id} className="w-full my-2">
                  <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={imgUrl}
                      alt={payload.alt || "Banner ảnh"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {payload.caption && (
                    <p className="text-xs opacity-75 text-center mt-1.5">{payload.caption}</p>
                  )}
                </div>
              );
            }

            case "spacer": {
              const payload = (block.payload || {}) as { height?: number };
              return (
                <div
                  key={block.block_id}
                  style={{ height: `${payload.height || 16}px` }}
                  aria-hidden="true"
                />
              );
            }

            case "divider": {
              return (
                <div
                  key={block.block_id}
                  className="w-full border-t border-white/10 my-2"
                  aria-hidden="true"
                />
              );
            }

            default:
              return null;
          }
        })}
      </main>

      {/* Footer without Beacons logo */}
      {isBeaconsCard ? (
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
  );
}
