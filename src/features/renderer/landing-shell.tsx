"use client";

import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Calendar,
  ChevronDown,
  ExternalLink,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import type { PublicNavItem, PublicSiteShell } from "@/features/public/types";
import type {
  SiteFloatingContactConfig,
  SiteFooterColumn,
  SiteHeaderConfig,
} from "@/features/site/types";
import { FONT_STACKS, isSafeColor, type FontId } from "@/config/theme-tokens";
import { resolveMediaUrl } from "./media";
import { PhoneActionButton, parsePhoneTarget, resolveZaloHref } from "./phone-action-sheet";
import { TrackingScripts } from "./tracking-scripts";

export type SitePreviewSection =
  "announcement" | "brand" | "nav" | "navbar" | "cta" | "footer" | "legal" | "floating";

interface LandingShellProps {
  siteShell: PublicSiteShell;
  currentSlug?: string;
  mode?: "public" | "preview";
  showFloatingInPreview?: boolean;
  activeSection?: SitePreviewSection | null;
  onSelectSection?: (section: SitePreviewSection) => void;
  children: ReactNode;
}

function resolveNavHref(item: PublicNavItem): string {
  if (item.target_type === "page") {
    return item.target_slug ? `/${item.target_slug}` : "#";
  }
  return item.target_value || "#";
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function LandingShell({
  siteShell,
  currentSlug,
  mode = "public",
  showFloatingInPreview = false,
  activeSection = null,
  onSelectSection,
  children,
}: LandingShellProps) {
  const isPreview = mode === "preview";
  const interactive = isPreview && Boolean(onSelectSection);

  const selectSection = (e: React.MouseEvent, section: SitePreviewSection) => {
    if (!onSelectSection) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectSection(section);
  };

  const sectionRing = (section: SitePreviewSection) => {
    if (!interactive) return "";
    const isActive = activeSection === section;
    return `cursor-pointer transition-shadow ${
      isActive
        ? "ring-2 ring-blue-500 ring-offset-1"
        : "hover:ring-2 hover:ring-blue-500/70 hover:ring-offset-1"
    }`;
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const settings = siteShell.settings || {};
  const headerConfig = (settings.header_config || {}) as SiteHeaderConfig & {
    copyrightText?: string;
  };
  const footerColumns = (
    Array.isArray(settings.footer_columns) ? settings.footer_columns : []
  ) as SiteFooterColumn[];
  const floating = (settings.floating_contact || {}) as SiteFloatingContactConfig;

  const logoSrc = resolveMediaUrl(settings.logo_url || undefined);
  const siteName = settings.site_name?.trim() || "GỜ CAFÉ";
  const isSticky = headerConfig.sticky !== false;

  const navLayout = headerConfig.navLayout || "classic";
  const navMaxWidthClass =
    headerConfig.navMaxWidth === "compact"
      ? "max-w-[1024px]"
      : headerConfig.navMaxWidth === "wide"
        ? "max-w-[1440px]"
        : headerConfig.navMaxWidth === "full"
          ? "max-w-none"
          : "max-w-[1200px]";
  const navHeight = headerConfig.navHeight || "default";
  const logoHeight =
    typeof headerConfig.logoHeight === "number" &&
    headerConfig.logoHeight >= 24 &&
    headerConfig.logoHeight <= 56
      ? headerConfig.logoHeight
      : 36;
  const navGap = headerConfig.navGap || "normal";

  const navFontKey: FontId =
    headerConfig.navFont && headerConfig.navFont in FONT_STACKS
      ? headerConfig.navFont
      : "lexend-deca";
  const navFontStack = FONT_STACKS[navFontKey];
  const navFontSize =
    typeof headerConfig.navFontSize === "number" &&
    headerConfig.navFontSize >= 11 &&
    headerConfig.navFontSize <= 20
      ? headerConfig.navFontSize
      : 13;
  const navUppercase = Boolean(headerConfig.navUppercase);
  const navLetterSpacingClass =
    headerConfig.navLetterSpacing === "wider"
      ? "tracking-[0.12em]"
      : headerConfig.navLetterSpacing === "wide"
        ? "tracking-[0.06em]"
        : navUppercase
          ? "tracking-[0.08em]"
          : "";
  const navWeight = headerConfig.navWeight || "500";
  const navActiveStyle = headerConfig.navActiveStyle || "text";
  const navBackdrop = headerConfig.navBackdrop || "glass";
  const navBgMode = headerConfig.navBgMode || "solid-color";
  const navBgOpacity =
    typeof headerConfig.navBgOpacity === "number" &&
    headerConfig.navBgOpacity >= 50 &&
    headerConfig.navBgOpacity <= 100
      ? headerConfig.navBgOpacity
      : 92;
  const navBlurClass =
    headerConfig.navBlur === "none"
      ? ""
      : headerConfig.navBlur === "sm"
        ? "backdrop-blur-xs"
        : headerConfig.navBlur === "lg"
          ? "backdrop-blur-xl"
          : "backdrop-blur-md";
  const navShadow = headerConfig.navShadow || "none";
  const navBorder = headerConfig.navBorder !== false;

  const navBgColor = isSafeColor(headerConfig.navBgColor) ? headerConfig.navBgColor : "#FFFFFF";
  const navBgGradientEnd = isSafeColor(headerConfig.navBgGradientEnd)
    ? headerConfig.navBgGradientEnd
    : "";
  const navBgGradientAngle =
    headerConfig.navBgGradientAngle === 135 || headerConfig.navBgGradientAngle === 180
      ? headerConfig.navBgGradientAngle
      : 90;
  const navTextColor = isSafeColor(headerConfig.navTextColor)
    ? headerConfig.navTextColor
    : "#111111";
  const navActiveColor = isSafeColor(headerConfig.navActiveColor)
    ? headerConfig.navActiveColor
    : "#B88A44";
  const dropdownRadiusClass =
    headerConfig.dropdownRadius === "md"
      ? "rounded-lg"
      : headerConfig.dropdownRadius === "2xl"
        ? "rounded-2xl"
        : "rounded-xl";
  const mobileDrawerSide = headerConfig.mobileDrawerSide || "right";
  const mobileDrawerShowContact = Boolean(headerConfig.mobileDrawerShowContact);

  const ctaBgColor = isSafeColor(headerConfig.ctaBgColor) ? headerConfig.ctaBgColor : "#111111";
  const ctaTextColor = isSafeColor(headerConfig.ctaTextColor)
    ? headerConfig.ctaTextColor
    : "#FFFFFF";
  const ctaRadiusClass =
    headerConfig.ctaRadius === "full"
      ? "rounded-full"
      : headerConfig.ctaRadius === "md"
        ? "rounded-md"
        : "rounded-xl";
  const ctaSizeClass =
    headerConfig.ctaSize === "sm"
      ? "h-8 px-3 text-[11px]"
      : headerConfig.ctaSize === "lg"
        ? "h-10 px-5 text-xs"
        : "h-9 px-3.5 @min-[36rem]:px-4 text-xs";
  const ctaIconKey = headerConfig.ctaIcon || "none";
  const CtaIconComponent =
    ctaIconKey === "arrow-right"
      ? ArrowRight
      : ctaIconKey === "phone"
        ? Phone
        : ctaIconKey === "sparkles"
          ? Sparkles
          : ctaIconKey === "calendar"
            ? Calendar
            : ctaIconKey === "shopping-bag"
              ? ShoppingBag
              : ctaIconKey === "message"
                ? MessageCircle
                : null;
  const ctaShowOnMobile = Boolean(headerConfig.ctaShowOnMobile);
  const showSecondaryCta = Boolean(
    headerConfig.ctaSecondaryEnabled && headerConfig.ctaSecondaryLabel?.trim()
  );
  const ctaSecondaryStyle = headerConfig.ctaSecondaryStyle || "outline";

  const showAnnouncement = Boolean(
    headerConfig.announcementEnabled &&
    headerConfig.announcementText?.trim() &&
    !(headerConfig.announcementDismissible && announcementDismissed)
  );
  const annBgColor = isSafeColor(headerConfig.announcementBgColor)
    ? headerConfig.announcementBgColor
    : "#111111";
  const annBgGradientEnd = isSafeColor(headerConfig.announcementBgGradientEnd)
    ? headerConfig.announcementBgGradientEnd
    : "";
  const annTextColor = isSafeColor(headerConfig.announcementTextColor)
    ? headerConfig.announcementTextColor
    : "#FFFFFF";
  const annFontSize =
    typeof headerConfig.announcementFontSize === "number" &&
    headerConfig.announcementFontSize >= 11 &&
    headerConfig.announcementFontSize <= 14
      ? headerConfig.announcementFontSize
      : 12;
  const annMode = headerConfig.announcementMode || "static";
  const annBadge = headerConfig.announcementBadge?.trim() || "";

  useEffect(() => {
    if (isPreview || navBackdrop !== "transparent-top") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isPreview, navBackdrop]);

  const isTransparentNow = !isPreview && navBackdrop === "transparent-top" && !scrolled;

  const navItems = siteShell.nav_items || [];
  const topItems = navItems.filter((n) => !n.parent_id).sort((a, b) => a.position - b.position);
  const getChildren = (parentId: string) =>
    navItems.filter((n) => n.parent_id === parentId).sort((a, b) => a.position - b.position);

  const homeHref = topItems[0] ? resolveNavHref(topItems[0]) : "/";

  const showFloatingCall = Boolean(floating.enabled && floating.showCall && floating.phone?.trim());
  const showFloatingZalo = Boolean(
    floating.enabled && floating.showZalo && (floating.zaloUrl?.trim() || floating.phone?.trim())
  );
  const parsedFloatingPhone = floating.phone ? parsePhoneTarget(floating.phone) : null;
  const floatingZaloHref = showFloatingZalo
    ? resolveZaloHref(parsedFloatingPhone?.zaloNumber || "", floating.zaloUrl)
    : "";

  const preventInPreview = (e: React.MouseEvent) => {
    if (isPreview) e.preventDefault();
  };

  const heightClass = navHeight === "compact" ? "h-14" : navHeight === "tall" ? "h-20" : "h-16";
  const gapClass = navGap === "compact" ? "gap-0.5" : navGap === "wide" ? "gap-3" : "gap-1.5";
  const weightClass =
    navWeight === "700" ? "font-bold" : navWeight === "600" ? "font-semibold" : "font-medium";
  const shadowClass = navShadow === "md" ? "shadow-md" : navShadow === "sm" ? "shadow-xs" : "";

  const useGradientNav = !isTransparentNow && navBgMode === "gradient" && Boolean(navBgGradientEnd);
  const effectiveBgStyle: CSSProperties = {
    backgroundColor: isTransparentNow
      ? "transparent"
      : useGradientNav
        ? undefined
        : navBackdrop === "solid"
          ? navBgColor
          : `color-mix(in srgb, ${navBgColor} ${navBgOpacity}%, transparent)`,
    backgroundImage: useGradientNav
      ? `linear-gradient(${navBgGradientAngle}deg, ${
          navBackdrop === "solid"
            ? navBgColor
            : `color-mix(in srgb, ${navBgColor} ${navBgOpacity}%, transparent)`
        }, ${
          navBackdrop === "solid"
            ? navBgGradientEnd
            : `color-mix(in srgb, ${navBgGradientEnd} ${navBgOpacity}%, transparent)`
        })`
      : undefined,
    color: navTextColor,
    fontFamily: navFontStack,
    borderColor:
      !isTransparentNow && navBorder
        ? `color-mix(in srgb, ${navTextColor} 12%, transparent)`
        : "transparent",
  };

  const getItemProps = (isActive: boolean): { className: string; style: CSSProperties } => {
    const base = `px-3 py-2 transition-all hover:opacity-80 ${
      navUppercase ? "uppercase" : ""
    } ${navLetterSpacingClass} ${isActive ? "font-semibold" : weightClass}`;

    if (navActiveStyle === "underline") {
      return {
        className: `${base} rounded-t-lg border-b-2`,
        style: {
          color: isActive ? navActiveColor : navTextColor,
          borderBottomColor: isActive ? navActiveColor : "transparent",
        },
      };
    }

    if (navActiveStyle === "pill") {
      return {
        className: `${base} rounded-full`,
        style: {
          color: isActive ? navActiveColor : navTextColor,
          backgroundColor: isActive
            ? `color-mix(in srgb, ${navActiveColor} 14%, transparent)`
            : "transparent",
        },
      };
    }

    return {
      className: `${base} rounded-lg`,
      style: { color: isActive ? navActiveColor : navTextColor },
    };
  };

  const brandBlock = (
    <Link
      href={homeHref}
      onClick={(e) => (interactive ? selectSection(e, "brand") : preventInPreview(e))}
      title={interactive ? "Bấm để sửa Logo & Thương hiệu" : undefined}
      className={`flex items-center gap-2.5 shrink-0 rounded-lg px-1 -mx-1 ${sectionRing("brand")}`}
    >
      {logoSrc && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt={siteName}
          style={{ height: `${logoHeight}px` }}
          className="w-auto max-w-[160px] object-contain"
        />
      )}
      {(!logoSrc || !headerConfig.hideSiteName) && (
        <span className="text-base font-bold tracking-tight" style={{ color: navTextColor }}>
          {siteName}
        </span>
      )}
    </Link>
  );

  const navMenuBlock = topItems.length > 0 && (
    <nav
      onClick={(e) => interactive && selectSection(e, "nav")}
      title={interactive ? "Bấm để sửa danh sách Menu (2 cấp)" : undefined}
      className={`hidden @min-[56rem]:flex items-center flex-wrap rounded-xl px-1 ${gapClass} ${sectionRing("nav")}`}
      style={{ fontSize: `${navFontSize}px` }}
      aria-label="Menu chính"
    >
      {topItems.map((item) => {
        const childrenItems = getChildren(item.id);
        const href = resolveNavHref(item);
        const isActive =
          (item.target_type === "page" && item.target_slug === currentSlug) ||
          childrenItems.some((c) => c.target_type === "page" && c.target_slug === currentSlug);

        const itemProps = getItemProps(isActive);

        if (childrenItems.length === 0) {
          return isExternalHref(href) ? (
            <a
              key={item.id}
              href={href}
              onClick={preventInPreview}
              target={isPreview ? undefined : "_blank"}
              rel="noopener noreferrer"
              style={itemProps.style}
              className={itemProps.className}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.id}
              href={href}
              onClick={preventInPreview}
              style={itemProps.style}
              className={itemProps.className}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <div
            key={item.id}
            className="relative group"
            onMouseEnter={() => setOpenDropdownId(item.id)}
            onMouseLeave={() => setOpenDropdownId(null)}
          >
            <button
              type="button"
              onClick={() => setOpenDropdownId((prev) => (prev === item.id ? null : item.id))}
              style={itemProps.style}
              className={`inline-flex items-center gap-1 cursor-pointer ${itemProps.className}`}
            >
              <span>{item.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {openDropdownId === item.id && (
              <div className="absolute left-0 top-full pt-1.5 min-w-[200px] z-50">
                <div
                  className={`${dropdownRadiusClass} border shadow-lg p-1.5 space-y-0.5`}
                  style={{
                    backgroundColor: navBgColor,
                    color: navTextColor,
                    borderColor: `color-mix(in srgb, ${navTextColor} 14%, transparent)`,
                  }}
                >
                  {childrenItems.map((child) => {
                    const cHref = resolveNavHref(child);
                    const cActive =
                      child.target_type === "page" && child.target_slug === currentSlug;
                    const cStyle = { color: cActive ? navActiveColor : navTextColor };
                    const cls = `block px-3 py-2 rounded-lg transition-opacity hover:opacity-75 ${
                      cActive ? "font-semibold" : "font-medium"
                    }`;
                    return isExternalHref(cHref) ? (
                      <a
                        key={child.id}
                        href={cHref}
                        style={cStyle}
                        target={isPreview ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          preventInPreview(e);
                          setOpenDropdownId(null);
                        }}
                        className={cls}
                      >
                        {child.label}
                      </a>
                    ) : (
                      <Link
                        key={child.id}
                        href={cHref}
                        style={cStyle}
                        onClick={(e) => {
                          preventInPreview(e);
                          setOpenDropdownId(null);
                        }}
                        className={cls}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const secondaryCtaStyleObj: CSSProperties =
    ctaSecondaryStyle === "soft"
      ? {
          color: navTextColor,
          backgroundColor: `color-mix(in srgb, ${navTextColor} 10%, transparent)`,
        }
      : ctaSecondaryStyle === "ghost"
        ? { color: navTextColor, backgroundColor: "transparent" }
        : {
            color: navTextColor,
            borderColor: `color-mix(in srgb, ${navTextColor} 28%, transparent)`,
          };

  const actionsBlock = (
    <div className="flex items-center gap-2 shrink-0">
      {showSecondaryCta && (
        <a
          href={headerConfig.ctaSecondaryHref || "#"}
          onClick={(e) => (interactive ? selectSection(e, "cta") : preventInPreview(e))}
          title={interactive ? "Bấm để sửa nút CTA phụ" : undefined}
          target={
            !isPreview && isExternalHref(headerConfig.ctaSecondaryHref || "") ? "_blank" : undefined
          }
          rel={
            !isPreview && isExternalHref(headerConfig.ctaSecondaryHref || "")
              ? "noopener noreferrer"
              : undefined
          }
          style={secondaryCtaStyleObj}
          className={`hidden @min-[44rem]:inline-flex items-center justify-center gap-1.5 ${ctaSizeClass} ${ctaRadiusClass} font-semibold hover:opacity-80 transition-opacity ${
            ctaSecondaryStyle === "outline" ? "border" : ""
          } ${sectionRing("cta")}`}
        >
          <span>{headerConfig.ctaSecondaryLabel}</span>
        </a>
      )}

      {headerConfig.ctaEnabled && headerConfig.ctaLabel?.trim() && (
        <a
          href={headerConfig.ctaHref || "#"}
          onClick={(e) => (interactive ? selectSection(e, "cta") : preventInPreview(e))}
          title={interactive ? "Bấm để sửa nút CTA" : undefined}
          target={!isPreview && isExternalHref(headerConfig.ctaHref || "") ? "_blank" : undefined}
          rel={
            !isPreview && isExternalHref(headerConfig.ctaHref || "")
              ? "noopener noreferrer"
              : undefined
          }
          style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
          className={`${
            ctaShowOnMobile ? "inline-flex" : "hidden @min-[36rem]:inline-flex"
          } items-center justify-center gap-1.5 ${ctaSizeClass} ${ctaRadiusClass} font-semibold hover:opacity-90 transition-opacity ${sectionRing("cta")}`}
        >
          {CtaIconComponent && ctaIconKey !== "arrow-right" && (
            <CtaIconComponent className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{headerConfig.ctaLabel}</span>
          {CtaIconComponent && ctaIconKey === "arrow-right" && (
            <CtaIconComponent className="w-3.5 h-3.5 shrink-0" />
          )}
        </a>
      )}

      {topItems.length > 0 && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
          style={{ color: navTextColor }}
          className="@min-[56rem]:hidden p-2 rounded-xl hover:opacity-75 transition-opacity cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const isFloatingPill = navLayout === "floating-pill";

  return (
    <div
      className={`@container ${isPreview ? "min-h-full relative" : "min-h-screen"} flex flex-col`}
      style={{ fontFamily: "var(--font-lexend-deca), var(--font-be-vietnam-pro), sans-serif" }}
    >
      {/* TOP ANNOUNCEMENT BAR */}
      {showAnnouncement && (
        <div
          onClick={(e) => interactive && selectSection(e, "announcement")}
          title={interactive ? "Bấm để sửa Thanh thông báo trên cùng" : undefined}
          className={`w-full px-4 py-2 text-center font-medium relative overflow-hidden group/ann ${
            headerConfig.announcementDismissible ? "pr-9" : ""
          } ${sectionRing("announcement")}`}
          style={{
            backgroundColor: annBgGradientEnd ? undefined : annBgColor,
            backgroundImage: annBgGradientEnd
              ? `linear-gradient(90deg, ${annBgColor}, ${annBgGradientEnd})`
              : undefined,
            color: annTextColor,
            fontSize: `${annFontSize}px`,
          }}
        >
          {annMode === "marquee" ? (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="gp-marquee-track items-center gap-8">
                {[0, 1].map((dup) => (
                  <span key={dup} className="inline-flex items-center gap-2 pr-8">
                    {annBadge && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${annTextColor} 18%, transparent)`,
                        }}
                      >
                        {annBadge}
                      </span>
                    )}
                    {headerConfig.announcementHref?.trim() ? (
                      <a
                        href={headerConfig.announcementHref}
                        onClick={preventInPreview}
                        target={
                          !isPreview && isExternalHref(headerConfig.announcementHref)
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          !isPreview && isExternalHref(headerConfig.announcementHref)
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <span>{headerConfig.announcementText}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span>{headerConfig.announcementText}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 flex-wrap">
              {annBadge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${annTextColor} 18%, transparent)`,
                  }}
                >
                  {annBadge}
                </span>
              )}
              {headerConfig.announcementHref?.trim() ? (
                <a
                  href={headerConfig.announcementHref}
                  onClick={preventInPreview}
                  target={
                    !isPreview && isExternalHref(headerConfig.announcementHref)
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    !isPreview && isExternalHref(headerConfig.announcementHref)
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center justify-center gap-1.5 hover:underline"
                >
                  <span>{headerConfig.announcementText}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                <span>{headerConfig.announcementText}</span>
              )}
            </div>
          )}

          {headerConfig.announcementDismissible && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAnnouncementDismissed(true);
              }}
              aria-label="Đóng thông báo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:opacity-75 cursor-pointer"
              style={{ color: annTextColor }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* STICKY / FLOATING NAVBAR */}
      {isFloatingPill ? (
        <div
          className={`${
            isSticky ? "sticky top-3 z-40" : "relative z-30 pt-3"
          } w-full px-3 @min-[48rem]:px-6 pointer-events-none`}
        >
          <header
            onClick={(e) => interactive && selectSection(e, "navbar")}
            title={interactive ? "Bấm để sửa giao diện thanh Navbar" : undefined}
            className={`pointer-events-auto ${navMaxWidthClass} mx-auto px-4 @min-[48rem]:px-6 ${heightClass} rounded-full flex items-center justify-between gap-4 border transition-all duration-200 ${
              navBackdrop !== "solid" && !isTransparentNow ? navBlurClass : ""
            } ${shadowClass || "shadow-md"} ${sectionRing("navbar")}`}
            style={effectiveBgStyle}
          >
            {brandBlock}
            {navMenuBlock}
            {actionsBlock}
          </header>
        </div>
      ) : (
        <header
          onClick={(e) => interactive && selectSection(e, "navbar")}
          title={interactive ? "Bấm để sửa giao diện thanh Navbar" : undefined}
          className={`${
            isSticky ? "sticky top-0 z-40" : "relative z-30"
          } w-full border-b transition-colors duration-200 ${
            navBackdrop !== "solid" && !isTransparentNow ? navBlurClass : ""
          } ${shadowClass} ${sectionRing("navbar")}`}
          style={effectiveBgStyle}
        >
          {navLayout === "centered-logo" ? (
            <div
              className={`${navMaxWidthClass} mx-auto px-4 @min-[48rem]:px-8 py-2.5 flex flex-col gap-2`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="hidden @min-[56rem]:block w-32" />
                <div className="flex-1 flex justify-start @min-[56rem]:justify-center">
                  {brandBlock}
                </div>
                <div className="@min-[56rem]:w-32 flex justify-end">{actionsBlock}</div>
              </div>
              {topItems.length > 0 && (
                <div className="hidden @min-[56rem]:flex justify-center pt-1 border-t border-current/10">
                  {navMenuBlock}
                </div>
              )}
            </div>
          ) : navLayout === "left" ? (
            <div
              className={`${navMaxWidthClass} mx-auto px-4 @min-[48rem]:px-8 ${heightClass} flex items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-6 min-w-0">
                {brandBlock}
                {navMenuBlock}
              </div>
              {actionsBlock}
            </div>
          ) : (
            <div
              className={`${navMaxWidthClass} mx-auto px-4 @min-[48rem]:px-8 ${heightClass} flex items-center justify-between gap-4`}
            >
              {brandBlock}
              {navMenuBlock}
              {actionsBlock}
            </div>
          )}
        </header>
      )}

      {/* MOBILE DRAWER MENU (đồng bộ màu theo Navbar) */}
      {mobileMenuOpen && (
        <div
          className={`${isPreview ? "absolute" : "fixed"} inset-0 z-50 @min-[56rem]:hidden bg-black/50 backdrop-blur-xs flex ${
            mobileDrawerSide === "left" ? "justify-start" : "justify-end"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={`${
              mobileDrawerSide === "full" ? "w-full" : "w-[82%] max-w-xs"
            } h-full shadow-2xl flex flex-col overflow-y-auto`}
            style={{
              backgroundColor: navBgColor,
              color: navTextColor,
              fontFamily: navFontStack,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 h-16 border-b shrink-0"
              style={{ borderColor: `color-mix(in srgb, ${navTextColor} 14%, transparent)` }}
            >
              <span className="font-bold text-sm">{siteName}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="p-1.5 rounded-lg hover:opacity-75 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1 flex-1">
              {topItems.map((item) => {
                const childrenItems = getChildren(item.id);
                const href = resolveNavHref(item);
                const isActive = item.target_type === "page" && item.target_slug === currentSlug;
                const linkStyle: CSSProperties = {
                  color: isActive ? navActiveColor : navTextColor,
                  backgroundColor: isActive
                    ? `color-mix(in srgb, ${navActiveColor} 12%, transparent)`
                    : "transparent",
                };

                return (
                  <div key={item.id} className="space-y-1">
                    {isExternalHref(href) ? (
                      <a
                        href={href}
                        target={isPreview ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          preventInPreview(e);
                          setMobileMenuOpen(false);
                        }}
                        style={linkStyle}
                        className={`block px-3 py-2.5 rounded-xl text-sm font-semibold ${
                          navUppercase ? "uppercase tracking-wider text-xs" : ""
                        }`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        onClick={(e) => {
                          preventInPreview(e);
                          setMobileMenuOpen(false);
                        }}
                        style={linkStyle}
                        className={`block px-3 py-2.5 rounded-xl text-sm font-semibold ${
                          navUppercase ? "uppercase tracking-wider text-xs" : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}

                    {childrenItems.length > 0 && (
                      <div
                        className="pl-4 border-l ml-3 space-y-0.5"
                        style={{
                          borderColor: `color-mix(in srgb, ${navTextColor} 18%, transparent)`,
                        }}
                      >
                        {childrenItems.map((child) => {
                          const cHref = resolveNavHref(child);
                          const cActive =
                            child.target_type === "page" && child.target_slug === currentSlug;
                          const cStyle: CSSProperties = {
                            color: cActive ? navActiveColor : navTextColor,
                            opacity: cActive ? 1 : 0.8,
                          };
                          return isExternalHref(cHref) ? (
                            <a
                              key={child.id}
                              href={cHref}
                              target={isPreview ? undefined : "_blank"}
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                preventInPreview(e);
                                setMobileMenuOpen(false);
                              }}
                              style={cStyle}
                              className="block px-3 py-2 rounded-lg text-xs font-medium"
                            >
                              {child.label}
                            </a>
                          ) : (
                            <Link
                              key={child.id}
                              href={cHref}
                              onClick={(e) => {
                                preventInPreview(e);
                                setMobileMenuOpen(false);
                              }}
                              style={cStyle}
                              className="block px-3 py-2 rounded-lg text-xs font-medium"
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {((headerConfig.ctaEnabled && headerConfig.ctaLabel?.trim()) ||
              showSecondaryCta ||
              mobileDrawerShowContact) && (
              <div
                className="p-4 border-t space-y-2.5"
                style={{ borderColor: `color-mix(in srgb, ${navTextColor} 14%, transparent)` }}
              >
                {headerConfig.ctaEnabled && headerConfig.ctaLabel?.trim() && (
                  <a
                    href={headerConfig.ctaHref || "#"}
                    onClick={(e) => {
                      preventInPreview(e);
                      setMobileMenuOpen(false);
                    }}
                    style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                    className={`w-full inline-flex items-center justify-center gap-1.5 h-11 ${ctaRadiusClass} text-sm font-semibold`}
                  >
                    {CtaIconComponent && ctaIconKey !== "arrow-right" && (
                      <CtaIconComponent className="w-4 h-4 shrink-0" />
                    )}
                    <span>{headerConfig.ctaLabel}</span>
                    {CtaIconComponent && ctaIconKey === "arrow-right" && (
                      <CtaIconComponent className="w-4 h-4 shrink-0" />
                    )}
                  </a>
                )}

                {showSecondaryCta && (
                  <a
                    href={headerConfig.ctaSecondaryHref || "#"}
                    onClick={(e) => {
                      preventInPreview(e);
                      setMobileMenuOpen(false);
                    }}
                    style={secondaryCtaStyleObj}
                    className={`w-full inline-flex items-center justify-center h-10 ${ctaRadiusClass} text-xs font-semibold ${
                      ctaSecondaryStyle === "outline" ? "border" : ""
                    }`}
                  >
                    {headerConfig.ctaSecondaryLabel}
                  </a>
                )}

                {mobileDrawerShowContact && floating.phone?.trim() && (
                  <a
                    href={`tel:${floating.phone}`}
                    onClick={preventInPreview}
                    className="flex items-center justify-center gap-2 text-xs font-semibold pt-1 opacity-85 hover:opacity-100"
                    style={{ color: navTextColor }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hotline: {floating.phone}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN PAGE CONTENT */}
      <div className="flex-1">{children}</div>
      {!isPreview && <TrackingScripts tracking={headerConfig.tracking} />}

      {/* FOOTER ĐỘNG (1-4 CỘT HOẶC CĂN GIỮA) */}
      {(footerColumns.length > 0 || headerConfig.copyrightText) &&
        (() => {
          const fs = headerConfig.footerStyle || {};
          const fLayout = fs.layout || "columns";
          const fPadClass =
            fs.padding === "compact" ? "py-8" : fs.padding === "spacious" ? "py-16" : "py-12";
          const fShowLogo = fs.showLogo !== false;
          const fBg = isSafeColor(fs.bgColor) ? fs.bgColor : "#F8F7F4";
          const fText = isSafeColor(fs.textColor) ? fs.textColor : "#111111";
          const fAccent = isSafeColor(fs.accentColor) ? fs.accentColor : "#B88A44";
          const fFontKey: FontId = fs.font && fs.font in FONT_STACKS ? fs.font : "lexend-deca";
          const fFontSize =
            typeof fs.fontSize === "number" && fs.fontSize >= 12 && fs.fontSize <= 16
              ? fs.fontSize
              : 14;
          const fBorder = `color-mix(in srgb, ${fText} 14%, transparent)`;
          const fMuted = `color-mix(in srgb, ${fText} 72%, transparent)`;
          const cols = footerColumns.slice(0, 4);
          const colGridClass =
            cols.length === 2
              ? "@min-[44rem]:grid-cols-2"
              : cols.length === 3
                ? "@min-[44rem]:grid-cols-3"
                : cols.length >= 4
                  ? "@min-[44rem]:grid-cols-2 @min-[60rem]:grid-cols-4"
                  : "";

          const socials = headerConfig.socialLinks || {};
          const socialList = [
            { label: "Facebook", href: socials.facebook },
            { label: "TikTok", href: socials.tiktok },
            { label: "Instagram", href: socials.instagram },
            { label: "Shopee", href: socials.shopee },
            { label: "YouTube", href: socials.youtube },
          ].filter((s): s is { label: string; href: string } =>
            Boolean(s.href && /^https?:\/\//i.test(s.href.trim()))
          );

          return (
            <footer
              onClick={(e) => interactive && selectSection(e, "footer")}
              title={interactive ? "Bấm để sửa cấu hình Footer (1–4 cột)" : undefined}
              className={`border-t ${sectionRing("footer")}`}
              style={{
                backgroundColor: fBg,
                color: fText,
                borderColor: fBorder,
                fontFamily: FONT_STACKS[fFontKey],
                fontSize: `${fFontSize}px`,
              }}
            >
              <div
                className={`max-w-[1200px] mx-auto px-5 @min-[40rem]:px-8 ${fPadClass} space-y-8`}
              >
                {fShowLogo && (logoSrc || siteName) && (
                  <div
                    className={`flex items-center gap-3 ${
                      fLayout === "centered" ? "justify-center" : "justify-start"
                    }`}
                  >
                    {logoSrc && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={logoSrc}
                        alt={siteName}
                        className="h-9 w-auto max-w-[140px] object-contain"
                      />
                    )}
                    {(!logoSrc || !headerConfig.hideSiteName) && (
                      <span className="text-base font-bold tracking-tight">{siteName}</span>
                    )}
                  </div>
                )}

                {cols.length > 0 &&
                  (fLayout === "centered" ? (
                    <div className="max-w-2xl mx-auto text-center space-y-5">
                      {cols[0]?.description && (
                        <p
                          className="leading-relaxed whitespace-pre-line"
                          style={{ color: fMuted }}
                        >
                          {cols[0].description}
                        </p>
                      )}
                      {cols.flatMap((c) => c.links || []).length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                          {cols
                            .flatMap((c) => c.links || [])
                            .map((lnk, lIdx) =>
                              isExternalHref(lnk.href) ? (
                                <a
                                  key={lIdx}
                                  href={lnk.href}
                                  onClick={preventInPreview}
                                  target={isPreview ? undefined : "_blank"}
                                  rel="noopener noreferrer"
                                  className="font-medium hover:underline transition-opacity hover:opacity-80"
                                >
                                  {lnk.label}
                                </a>
                              ) : (
                                <Link
                                  key={lIdx}
                                  href={lnk.href}
                                  onClick={preventInPreview}
                                  className="font-medium hover:underline transition-opacity hover:opacity-80"
                                >
                                  {lnk.label}
                                </Link>
                              )
                            )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`grid grid-cols-1 gap-8 ${colGridClass}`}>
                      {cols.map((col, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3
                            className="text-xs font-bold uppercase tracking-[0.15em]"
                            style={{ color: fAccent }}
                          >
                            {col.title}
                          </h3>
                          {col.description && (
                            <p
                              className="leading-relaxed whitespace-pre-line"
                              style={{ color: fMuted }}
                            >
                              {col.description}
                            </p>
                          )}
                          {col.links && col.links.length > 0 && (
                            <ul className="space-y-2 pt-1">
                              {col.links.map((lnk, lIdx) => (
                                <li key={lIdx}>
                                  {isExternalHref(lnk.href) ? (
                                    <a
                                      href={lnk.href}
                                      onClick={preventInPreview}
                                      target={isPreview ? undefined : "_blank"}
                                      rel="noopener noreferrer"
                                      style={{ color: fMuted }}
                                      className="hover:underline transition-opacity hover:opacity-100"
                                    >
                                      {lnk.label}
                                    </a>
                                  ) : (
                                    <Link
                                      href={lnk.href}
                                      onClick={preventInPreview}
                                      style={{ color: fMuted }}
                                      className="hover:underline transition-opacity hover:opacity-100"
                                    >
                                      {lnk.label}
                                    </Link>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                <div
                  onClick={(e) => interactive && selectSection(e, "legal")}
                  title={interactive ? "Bấm để sửa Bản quyền & Liên kết pháp lý" : undefined}
                  className={`pt-6 border-t flex flex-col @min-[40rem]:flex-row items-center justify-between gap-3 text-xs rounded-lg ${sectionRing("legal")}`}
                  style={{ borderColor: fBorder, color: fMuted }}
                >
                  <div className="flex flex-wrap items-center justify-center @min-[40rem]:justify-start gap-x-4 gap-y-1">
                    <span>
                      {headerConfig.copyrightText || `© ${new Date().getFullYear()} ${siteName}`}
                    </span>
                    {(headerConfig.legalLinks || [])
                      .filter((l) => l.label?.trim() && l.href?.trim())
                      .map((l, idx) =>
                        isExternalHref(l.href) ? (
                          <a
                            key={idx}
                            href={l.href}
                            onClick={preventInPreview}
                            target={isPreview ? undefined : "_blank"}
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {l.label}
                          </a>
                        ) : (
                          <Link
                            key={idx}
                            href={l.href}
                            onClick={preventInPreview}
                            className="hover:underline"
                          >
                            {l.label}
                          </Link>
                        )
                      )}
                  </div>
                  {socialList.length === 0 ? (
                    <span className="tracking-wider uppercase text-[11px] font-medium">
                      {siteName}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {socialList.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          onClick={preventInPreview}
                          target={isPreview ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          style={{ borderColor: fBorder, color: fText }}
                          className="px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-opacity hover:opacity-80"
                        >
                          {s.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </footer>
          );
        })()}

      {/* FLOATING ACTION BAR ĐỘNG — 4 CHẾ ĐỘ (ICON / PILL / MOBILE BOTTOM-BAR / SPEED-DIAL) */}
      {(showFloatingCall ||
        showFloatingZalo ||
        (floating.enabled && (floating.customButtons?.length || 0) > 0) ||
        (floating.enabled && floating.showBackToTop)) &&
        (!isPreview || showFloatingInPreview) &&
        (() => {
          const fStyle = floating.style || "icon";
          const fSize = floating.size || "md";
          const fVisibility = floating.visibility || "all";
          const bottomPx =
            typeof floating.bottomOffset === "number" &&
            floating.bottomOffset >= 12 &&
            floating.bottomOffset <= 96
              ? floating.bottomOffset
              : 20;
          const sidePx =
            typeof floating.sideOffset === "number" &&
            floating.sideOffset >= 12 &&
            floating.sideOffset <= 48
              ? floating.sideOffset
              : 20;
          const callBg = isSafeColor(floating.callBgColor) ? floating.callBgColor : "#111111";
          const callFg = isSafeColor(floating.callTextColor) ? floating.callTextColor : "#FFFFFF";
          const callLabel = floating.callLabel?.trim() || "Gọi ngay";
          const callIconSrc = resolveMediaUrl(floating.callIconUrl?.trim() || undefined);
          const zaloBg = isSafeColor(floating.zaloBgColor) ? floating.zaloBgColor : "#0068FF";
          const zaloFg = isSafeColor(floating.zaloTextColor) ? floating.zaloTextColor : "#FFFFFF";
          const zaloLabel = floating.zaloLabel?.trim() || "Nhắn Zalo";
          const zaloIconSrc = resolveMediaUrl(floating.zaloIconUrl?.trim() || undefined);

          const renderButtonVisual = (
            imgSrc: string | undefined,
            fallback: ReactNode,
            alt: string,
            asFullCircle: boolean
          ) => {
            if (imgSrc) {
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imgSrc}
                  alt={alt}
                  className={
                    asFullCircle
                      ? "w-full h-full rounded-full object-cover"
                      : "w-5 h-5 rounded-full object-cover shrink-0"
                  }
                />
              );
            }
            return fallback;
          };

          const iconSizeClass =
            fSize === "sm" ? "w-10 h-10" : fSize === "lg" ? "w-14 h-14" : "w-12 h-12";
          const pillHeightClass =
            fSize === "sm"
              ? "h-9 px-3 text-[11px]"
              : fSize === "lg"
                ? "h-12 px-4 text-sm"
                : "h-10 px-3.5 text-xs";
          const visibilityClass =
            fVisibility === "mobile-only"
              ? "@min-[48rem]:hidden"
              : fVisibility === "desktop-only"
                ? "hidden @min-[48rem]:flex"
                : "";
          const isPill = fStyle === "pill";
          const isBottomBar = fStyle === "bottom-bar";
          const isSpeedDial = fStyle === "speed-dial";
          const alignEnd = floating.position !== "left";

          const validCustomButtons = (floating.customButtons || []).filter(
            (b) => b.label?.trim() && b.href?.trim()
          );

          const renderCornerButtons = () => (
            <>
              {floating.enabled && floating.showBackToTop && (
                <button
                  type="button"
                  onClick={(e) => {
                    if (isPreview) {
                      const scrollParent = (e.currentTarget as HTMLElement).closest(
                        "[data-preview-scroll]"
                      );
                      scrollParent?.scrollTo({ top: 0, behavior: "smooth" });
                      return;
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-label="Lên đầu trang"
                  title="Lên đầu trang"
                  className={`${
                    isPill ? `${pillHeightClass} rounded-full gap-1.5` : "w-11 h-11 rounded-full"
                  } bg-white/95 text-[#111111] border border-zinc-200 shadow-md hover:scale-105 transition-transform inline-flex items-center justify-center font-semibold cursor-pointer`}
                >
                  <ArrowUp className="w-4 h-4 shrink-0" />
                  {isPill && <span>Đầu trang</span>}
                </button>
              )}

              {floating.enabled &&
                validCustomButtons.map((btn) => {
                  const bg = isSafeColor(btn.bgColor) ? btn.bgColor : "#111111";
                  const fg = isSafeColor(btn.textColor) ? btn.textColor : "#FFFFFF";
                  const btnImgSrc = resolveMediaUrl(btn.imageUrl?.trim() || undefined);
                  const Icon =
                    btn.icon === "phone"
                      ? Phone
                      : btn.icon === "maps"
                        ? MapPin
                        : btn.icon === "messenger" || btn.icon === "zalo"
                          ? MessageCircle
                          : btn.icon === "tiktok"
                            ? Send
                            : btn.icon === "calendar"
                              ? Calendar
                              : btn.icon === "shopping-bag" || btn.icon === "shopee"
                                ? ShoppingBag
                                : ExternalLink;
                  return (
                    <div key={btn.id} className="relative inline-flex items-center justify-center">
                      {floating.pulseCall && (
                        <span
                          className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
                          style={{ backgroundColor: bg }}
                        />
                      )}
                      <a
                        href={btn.href}
                        onClick={preventInPreview}
                        target={!isPreview && isExternalHref(btn.href) ? "_blank" : undefined}
                        rel={
                          !isPreview && isExternalHref(btn.href) ? "noopener noreferrer" : undefined
                        }
                        aria-label={btn.label}
                        title={btn.label}
                        style={{ backgroundColor: bg, color: fg }}
                        className={`relative ${
                          isPill
                            ? `${pillHeightClass} rounded-full gap-2`
                            : `${iconSizeClass} rounded-full overflow-hidden`
                        } shadow-lg hover:scale-105 transition-transform inline-flex items-center justify-center font-semibold`}
                      >
                        {renderButtonVisual(
                          btnImgSrc,
                          <Icon className="w-4 h-4 shrink-0" />,
                          btn.label,
                          !isPill
                        )}
                        {isPill && <span className="whitespace-nowrap">{btn.label}</span>}
                      </a>
                    </div>
                  );
                })}

              {showFloatingZalo && floatingZaloHref && (
                <div className="relative inline-flex items-center justify-center">
                  {floating.pulseCall && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
                      style={{ backgroundColor: zaloBg }}
                    />
                  )}
                  <a
                    href={floatingZaloHref}
                    onClick={preventInPreview}
                    target={isPreview ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={zaloLabel}
                    title={zaloLabel}
                    style={{ backgroundColor: zaloBg, color: zaloFg }}
                    className={`relative ${
                      isPill
                        ? `${pillHeightClass} rounded-full gap-2`
                        : `${iconSizeClass} rounded-full overflow-hidden`
                    } shadow-lg hover:scale-105 transition-transform inline-flex items-center justify-center font-semibold`}
                  >
                    {renderButtonVisual(
                      zaloIconSrc,
                      <MessageCircle className="w-4 h-4 shrink-0" />,
                      zaloLabel,
                      !isPill
                    )}
                    {isPill && <span className="whitespace-nowrap">{zaloLabel}</span>}
                  </a>
                </div>
              )}

              {showFloatingCall && floating.phone && (
                <div className="relative inline-flex items-center justify-center">
                  {floating.pulseCall && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
                      style={{ backgroundColor: callBg }}
                    />
                  )}
                  {isPreview ? (
                    <button
                      type="button"
                      onClick={preventInPreview}
                      aria-label={`Hotline ${siteName}`}
                      title={`Gọi ${floating.phone}`}
                      style={{ backgroundColor: callBg, color: callFg }}
                      className={`relative ${
                        isPill
                          ? `${pillHeightClass} rounded-full gap-2`
                          : `${iconSizeClass} rounded-full overflow-hidden`
                      } shadow-lg hover:scale-105 transition-transform inline-flex items-center justify-center font-semibold border border-[#B88A44]/40 cursor-pointer`}
                    >
                      {renderButtonVisual(
                        callIconSrc,
                        <Phone className="w-4 h-4 shrink-0" />,
                        callLabel,
                        !isPill
                      )}
                      {isPill && <span className="whitespace-nowrap">{callLabel}</span>}
                    </button>
                  ) : (
                    <PhoneActionButton
                      targetUrl={`tel:${floating.phone}`}
                      zaloTarget={floating.zaloUrl || undefined}
                      label={`Hotline ${siteName}`}
                      title={`Gọi ${floating.phone}`}
                      style={{ backgroundColor: callBg, color: callFg }}
                      className={`relative ${
                        isPill
                          ? `${pillHeightClass} rounded-full gap-2`
                          : `${iconSizeClass} rounded-full overflow-hidden`
                      } shadow-lg hover:scale-105 transition-transform inline-flex items-center justify-center font-semibold border border-[#B88A44]/40`}
                    >
                      {renderButtonVisual(
                        callIconSrc,
                        <Phone className="w-4 h-4 shrink-0" />,
                        callLabel,
                        !isPill
                      )}
                      {isPill && <span className="whitespace-nowrap">{callLabel}</span>}
                    </PhoneActionButton>
                  )}
                </div>
              )}
            </>
          );

          return (
            <>
              {/* Mobile Sticky Bottom Bar (khi chọn style = "bottom-bar") */}
              {isBottomBar && fVisibility !== "desktop-only" && (
                <div
                  onClick={(e) => interactive && selectSection(e, "floating")}
                  title={interactive ? "Bấm để sửa Cụm nút liên hệ nổi" : undefined}
                  className={`@min-[48rem]:hidden ${
                    isPreview ? "sticky bottom-0 z-30" : "fixed bottom-0 left-0 right-0 z-40"
                  } w-full bg-white/95 backdrop-blur-md border-t border-zinc-200 px-3 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)] ${sectionRing("floating")}`}
                >
                  <div className="grid grid-flow-col auto-cols-fr gap-2">
                    {showFloatingCall && floating.phone && (
                      <a
                        href={`tel:${floating.phone}`}
                        onClick={preventInPreview}
                        style={{ backgroundColor: callBg, color: callFg }}
                        className="h-10 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs px-2"
                      >
                        {renderButtonVisual(
                          callIconSrc,
                          <Phone className="w-4 h-4 shrink-0" />,
                          callLabel,
                          false
                        )}
                        <span className="truncate">{callLabel}</span>
                      </a>
                    )}
                    {showFloatingZalo && floatingZaloHref && (
                      <a
                        href={floatingZaloHref}
                        onClick={preventInPreview}
                        target={isPreview ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        style={{ backgroundColor: zaloBg, color: zaloFg }}
                        className="h-10 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs px-2"
                      >
                        {renderButtonVisual(
                          zaloIconSrc,
                          <MessageCircle className="w-4 h-4 shrink-0" />,
                          zaloLabel,
                          false
                        )}
                        <span className="truncate">{zaloLabel}</span>
                      </a>
                    )}
                    {validCustomButtons.slice(0, 2).map((btn) => {
                      const btnImgSrc = resolveMediaUrl(btn.imageUrl?.trim() || undefined);
                      return (
                        <a
                          key={btn.id}
                          href={btn.href}
                          onClick={preventInPreview}
                          target={!isPreview && isExternalHref(btn.href) ? "_blank" : undefined}
                          rel={
                            !isPreview && isExternalHref(btn.href)
                              ? "noopener noreferrer"
                              : undefined
                          }
                          style={{
                            backgroundColor: isSafeColor(btn.bgColor) ? btn.bgColor : "#111111",
                            color: isSafeColor(btn.textColor) ? btn.textColor : "#FFFFFF",
                          }}
                          className="h-10 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs px-2"
                        >
                          {btnImgSrc && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={btnImgSrc}
                              alt={btn.label}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                          )}
                          <span className="truncate">{btn.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Corner Stack (icon / pill / speed-dial / và fallback desktop cho bottom-bar) */}
              <div
                className={`${visibilityClass} ${
                  isBottomBar ? "hidden @min-[48rem]:flex" : "flex"
                } ${
                  isPreview
                    ? `sticky z-30 h-0 overflow-visible w-full pointer-events-none items-end ${
                        alignEnd ? "justify-end" : "justify-start"
                      }`
                    : "fixed z-40 flex-col"
                }`}
                style={
                  isPreview
                    ? {
                        bottom: `${bottomPx}px`,
                        paddingLeft: `${sidePx}px`,
                        paddingRight: `${sidePx}px`,
                      }
                    : {
                        bottom: `${bottomPx}px`,
                        ...(alignEnd ? { right: `${sidePx}px` } : { left: `${sidePx}px` }),
                      }
                }
              >
                <div
                  onClick={(e) => interactive && selectSection(e, "floating")}
                  title={interactive ? "Bấm để sửa Cụm nút liên hệ nổi" : undefined}
                  className={`${
                    isPreview
                      ? `pointer-events-auto flex flex-col gap-2.5 p-1 rounded-2xl ${
                          alignEnd ? "items-end" : "items-start"
                        } ${sectionRing("floating")}`
                      : `flex flex-col gap-2.5 ${alignEnd ? "items-end" : "items-start"}`
                  }`}
                >
                  {isSpeedDial ? (
                    <>
                      {speedDialOpen && (
                        <div
                          className={`flex flex-col gap-2.5 ${
                            alignEnd ? "items-end" : "items-start"
                          }`}
                        >
                          {renderCornerButtons()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSpeedDialOpen((v) => !v);
                        }}
                        aria-label={speedDialOpen ? "Thu gọn nút liên hệ" : "Mở nút liên hệ"}
                        style={{ backgroundColor: callBg, color: callFg }}
                        className={`${iconSizeClass} rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center cursor-pointer border border-white/20`}
                      >
                        {speedDialOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </button>
                    </>
                  ) : (
                    renderCornerButtons()
                  )}
                </div>
              </div>
            </>
          );
        })()}
    </div>
  );
}
