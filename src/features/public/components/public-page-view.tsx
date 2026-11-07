import Image from "next/image";
import { resolveTheme } from "@/config/themes";
import { getPublicMediaUrl } from "@/features/media/queries";
import { renderLnkBioFormattedText } from "./lnkbio-format";
import type { PublicPageDTO } from "../types";
import { Link2, Phone, Mail, Share2 } from "lucide-react";

interface PublicPageViewProps {
  page: PublicPageDTO;
}

export function PublicPageView({ page }: PublicPageViewProps) {
  const theme = resolveTheme(page.theme);
  const accentColor = theme.accentColor || "#2563eb";

  const pillRadiusClass =
    theme.borderRadius === "sm"
      ? "rounded-xl"
      : theme.borderRadius === "md"
        ? "rounded-2xl"
        : theme.borderRadius === "none"
          ? "rounded-none"
          : "rounded-[31px]";

  const blocks = page.blocks || [];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between pt-10 pb-6 px-4 sm:px-6 relative overflow-x-hidden select-none transition-colors duration-200"
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accentColor}14 0%, transparent 65%)`,
        color: theme.textColor,
        fontFamily:
          theme.fontFamily === "be-vietnam-pro"
            ? "var(--font-be-vietnam-pro), sans-serif"
            : "var(--font-inter), sans-serif",
        letterSpacing: "0.6px",
      }}
    >
      {/* Main Lnk.Bio Centered Container (col-12 col-lg-8 equivalent) */}
      <main className="w-full max-w-[680px] mx-auto space-y-5 z-10">
        {blocks.map((block) => {
          switch (block.type) {
            case "header": {
              const p = block.payload as {
                title?: string;
                bio?: string;
                avatarUrl?: string;
                avatarMediaId?: string;
              };

              return (
                <div key={block.block_id} className="text-center">
                  {/* Profile Picture (.pb-profilepic.profilepic_large.profilepic-shadow) */}
                  {p.avatarUrl && (
                    <div
                      className="relative w-[110px] h-[110px] mx-auto rounded-full overflow-hidden block"
                      style={{
                        boxShadow: `0 1px 2px ${accentColor}20, 0 2px 4px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.08), 0 8px 16px rgba(15, 23, 42, 0.08), 0 16px 32px ${accentColor}1a`,
                      }}
                    >
                      <Image
                        src={p.avatarUrl}
                        alt={p.title || page.title || "HỒ PHƯỢNG ÁNH"}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Display Name (.pb-name) */}
                  <h1 className="mt-2.5 text-[16px] sm:text-[17px] font-bold uppercase tracking-[1px] text-center">
                    {p.title || page.title || "HỒ PHƯỢNG ÁNH"}
                  </h1>

                  {/* Bio (.pb-bio) */}
                  {p.bio && (
                    <div className="mt-5 space-y-2.5 text-center mx-auto">
                      {renderLnkBioFormattedText(p.bio, "center", accentColor)}
                    </div>
                  )}
                </div>
              );
            }

            case "heading": {
              const p = block.payload as { text?: string; level?: number };
              const level = p.level || 1;

              return (
                <div key={block.block_id} className="pt-2 text-center">
                  {level === 1 ? (
                    <h2 className="text-[18px] sm:text-[19px] font-medium uppercase tracking-[1px] text-center">
                      {p.text}
                    </h2>
                  ) : level === 2 ? (
                    <h3 className="text-[15px] sm:text-[16px] font-bold uppercase tracking-[1px] text-center">
                      {p.text}
                    </h3>
                  ) : (
                    <h4 className="text-xs font-semibold uppercase tracking-[1px] text-center opacity-80">
                      {p.text}
                    </h4>
                  )}
                </div>
              );
            }

            case "text": {
              const p = block.payload as { content?: string; align?: string };
              const align = p.align || "center";

              return (
                <div key={block.block_id} className="pt-1 space-y-1.5">
                  {p.content ? renderLnkBioFormattedText(p.content, align, accentColor) : null}
                </div>
              );
            }

            case "image": {
              const p = block.payload as {
                imageUrl?: string;
                alt?: string;
                caption?: string;
              };

              return (
                <div key={block.block_id} className="space-y-1.5 overflow-hidden">
                  {p.imageUrl && (
                    <div className="relative w-full aspect-16/9 overflow-hidden rounded-2xl border border-blue-100 shadow-xs">
                      <Image
                        src={p.imageUrl}
                        alt={p.alt || "Hình ảnh"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {p.caption && <p className="text-xs opacity-75 text-center">{p.caption}</p>}
                </div>
              );
            }

            case "link_list": {
              const p = block.payload as { layout?: string };
              const isGrid = p.layout === "grid";

              return (
                <div
                  key={block.block_id}
                  className={isGrid ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1" : "space-y-2.5 pt-1"}
                >
                  {block.links.map((link) => {
                    const iconUrl = link.media_url ? getPublicMediaUrl(link.media_url) : null;
                    const isContact = link.kind === "contact";
                    const hasLeftIcon = Boolean(iconUrl) || isContact;

                    return (
                      <a
                        key={link.page_link_id}
                        href={`/r/${link.page_link_id}`}
                        target={isContact ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        title={link.label}
                        className={`group relative min-h-[64px] w-full flex items-center justify-center p-2 border-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:shadow-blue-500/15 active:scale-[0.99] ${pillRadiusClass}`}
                        style={{
                          backgroundColor: theme.cardBackground,
                          color: theme.cardTextColor,
                          borderColor: theme.cardBorderColor || theme.cardBackground,
                        }}
                      >
                        {/* Left 50x50 Circular Thumbnail (.pb-linkimage) */}
                        {iconUrl ? (
                          <div className="w-[50px] h-[50px] rounded-full overflow-hidden absolute left-[7px] top-1/2 -translate-y-1/2 bg-white shrink-0 shadow-xs">
                            <Image
                              src={iconUrl}
                              alt={link.label}
                              fill
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : isContact ? (
                          <div className="w-[50px] h-[50px] rounded-full absolute left-[7px] top-1/2 -translate-y-1/2 bg-white/15 flex items-center justify-center shrink-0">
                            {link.target_url.startsWith("tel:") ? (
                              <Phone className="w-5 h-5" />
                            ) : (
                              <Mail className="w-5 h-5" />
                            )}
                          </div>
                        ) : null}

                        {/* Centered Bold Uppercase Title (.pb-linktitle) */}
                        <span
                          className={`block w-full text-center font-bold uppercase text-[13px] sm:text-[14px] tracking-[1px] leading-snug wrap-break-word ${
                            hasLeftIcon ? "px-16" : "px-6"
                          }`}
                        >
                          {link.label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              );
            }

            case "social_icons": {
              return (
                <div
                  key={block.block_id}
                  className="flex items-center justify-center gap-3 py-2 flex-wrap"
                >
                  {block.links.map((link) => {
                    const iconUrl = link.media_url ? getPublicMediaUrl(link.media_url) : null;

                    return (
                      <a
                        key={link.page_link_id}
                        href={`/r/${link.page_link_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs"
                        style={{
                          backgroundColor: theme.cardBackground,
                          color: theme.cardTextColor,
                          borderColor: theme.cardBorderColor || "transparent",
                        }}
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
                          <Share2 className="w-4 h-4 opacity-90" />
                        )}
                      </a>
                    );
                  })}
                </div>
              );
            }

            case "spacer": {
              const p = block.payload as { height?: string };
              const h =
                p.height === "xl"
                  ? "h-14"
                  : p.height === "lg"
                    ? "h-10"
                    : p.height === "md"
                      ? "h-6"
                      : "h-3";
              return <div key={block.block_id} className={h} />;
            }

            case "divider": {
              const p = block.payload as { style?: string };
              const style = p.style || "solid";
              return (
                <div key={block.block_id} className="py-2">
                  <hr
                    className={`border-t opacity-20 border-${style}`}
                    style={{ borderColor: theme.textColor }}
                  />
                </div>
              );
            }

            default:
              return null;
          }
        })}
      </main>

      {/* Lnk.Bio-style Footer (.pb-footer) */}
      <footer className="pt-14 pb-4 w-full text-center z-10">
        <div className="inline-flex items-center justify-center gap-2 opacity-85 hover:opacity-100 transition-opacity">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-white shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            <Link2 className="w-4 h-4" />
          </span>
          <span className="font-bold text-sm tracking-[1px]" style={{ color: theme.textColor }}>
            Gờ Cafe
          </span>
        </div>
      </footer>
    </div>
  );
}
