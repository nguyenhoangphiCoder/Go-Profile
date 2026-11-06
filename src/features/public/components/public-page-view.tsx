import Image from "next/image";
import { THEME_PRESETS } from "@/config/themes";
import { getPublicMediaUrl } from "@/features/media/queries";
import type { PublicPageDTO } from "../types";
import { ExternalLink, Phone, Mail, Share2 } from "lucide-react";

interface PublicPageViewProps {
  page: PublicPageDTO;
}

export function PublicPageView({ page }: PublicPageViewProps) {
  const themePresetKey = page.theme?.preset || "go-original";
  const theme = THEME_PRESETS[themePresetKey] || THEME_PRESETS["go-original"];

  const radiusClass =
    theme.borderRadius === "full"
      ? "rounded-2xl"
      : theme.borderRadius === "sm"
        ? "rounded-md"
        : theme.borderRadius === "none"
          ? "rounded-none"
          : "rounded-xl";

  const blocks = page.blocks || [];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between px-4 py-8 sm:py-12 transition-colors duration-200"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily:
          theme.fontFamily === "be-vietnam-pro"
            ? "var(--font-be-vietnam-pro), sans-serif"
            : "var(--font-inter), sans-serif",
      }}
    >
      <main className="w-full max-w-md mx-auto space-y-5">
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
                <div key={block.block_id} className="text-center space-y-3 pb-2">
                  {p.avatarUrl && (
                    <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-white/10 shadow-lg">
                      <Image
                        src={p.avatarUrl}
                        alt={p.title || page.title || "Gờ Cafe"}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                      {p.title || page.title || "Gờ Cafe"}
                    </h1>
                    {p.bio && (
                      <p className="text-xs sm:text-sm opacity-85 mt-1.5 whitespace-pre-wrap leading-relaxed max-w-sm mx-auto">
                        {p.bio}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            case "heading": {
              const p = block.payload as { text?: string; level?: number };
              const level = p.level || 2;

              return (
                <div key={block.block_id} className="pt-2">
                  {level === 1 ? (
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-center">
                      {p.text}
                    </h2>
                  ) : level === 2 ? (
                    <h3 className="text-sm sm:text-base font-bold tracking-tight text-center">
                      {p.text}
                    </h3>
                  ) : (
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-center opacity-75">
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
                <div
                  key={block.block_id}
                  className={`text-xs sm:text-sm opacity-85 leading-relaxed whitespace-pre-wrap text-${align}`}
                >
                  {p.content}
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
                    <div className={`relative w-full aspect-16/9 overflow-hidden ${radiusClass}`}>
                      <Image
                        src={p.imageUrl}
                        alt={p.alt || "Hình ảnh"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {p.caption && <p className="text-[11px] opacity-65 text-center">{p.caption}</p>}
                </div>
              );
            }

            case "link_list": {
              const p = block.payload as { layout?: string };
              const isGrid = p.layout === "grid";

              return (
                <div
                  key={block.block_id}
                  className={isGrid ? "grid grid-cols-2 gap-3" : "space-y-3"}
                >
                  {block.links.map((link) => {
                    const iconUrl = link.media_url ? getPublicMediaUrl(link.media_url) : null;
                    const isContact = link.kind === "contact";

                    return (
                      <a
                        key={link.page_link_id}
                        href={`/r/${link.page_link_id}`}
                        target={isContact ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3.5 p-3.5 sm:p-4 transition-all duration-200 hover:scale-[1.015] active:scale-[0.985] shadow-xs border ${radiusClass}`}
                        style={{
                          backgroundColor: theme.cardBackground,
                          color: theme.cardTextColor,
                          borderColor: theme.cardBorderColor || "transparent",
                        }}
                      >
                        {iconUrl ? (
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={iconUrl}
                              alt={link.label}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : link.target_url.startsWith("tel:") ? (
                          <Phone className="w-5 h-5 shrink-0 opacity-80" />
                        ) : link.target_url.startsWith("mailto:") ? (
                          <Mail className="w-5 h-5 shrink-0 opacity-80" />
                        ) : (
                          <ExternalLink className="w-5 h-5 shrink-0 opacity-80" />
                        )}

                        <span className="text-xs sm:text-sm font-semibold truncate flex-1 text-center">
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
                        className="w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs"
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
                          <Share2 className="w-4 h-4 opacity-80" />
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

      {/* Branded Footer */}
      <footer className="pt-12 pb-4 text-center opacity-50 text-xs">
        <p className="font-semibold tracking-wide">Gờ Cafe</p>
      </footer>
    </div>
  );
}
