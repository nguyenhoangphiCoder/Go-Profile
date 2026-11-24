import { PageRenderer } from "@/features/renderer/page-renderer";
import { LandingShell } from "@/features/renderer/landing-shell";
import { fromPublicBlocks } from "@/features/renderer/adapters";
import type { PublicBranchItem } from "@/features/branches/types";
import type { PublicPageDTO } from "../types";

interface PublicPageViewProps {
  page: PublicPageDTO;
  branches?: PublicBranchItem[];
}

export function PublicPageView({ page, branches }: PublicPageViewProps) {
  const isLanding = page.page_kind === "landing";
  const useSiteShell = isLanding && page.seo?.showSiteShell !== false && Boolean(page.site_shell);

  const content = (
    <PageRenderer
      mode="public"
      pageKind={page.page_kind}
      currentSlug={page.slug}
      branches={branches}
      title={page.title || ""}
      theme={page.theme}
      blocks={fromPublicBlocks(page.blocks)}
      showFooterBadge={useSiteShell ? false : page.seo?.showFooterBadge}
      footerBadgeText={page.seo?.footerBadgeText}
    />
  );

  if (useSiteShell && page.site_shell) {
    return (
      <LandingShell siteShell={page.site_shell} currentSlug={page.slug}>
        {content}
      </LandingShell>
    );
  }

  return content;
}
