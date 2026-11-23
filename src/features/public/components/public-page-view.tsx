import { PageRenderer } from "@/features/renderer/page-renderer";
import { fromPublicBlocks } from "@/features/renderer/adapters";
import type { PublicPageDTO } from "../types";

interface PublicPageViewProps {
  page: PublicPageDTO;
}

export function PublicPageView({ page }: PublicPageViewProps) {
  return (
    <PageRenderer
      mode="public"
      title={page.title || ""}
      theme={page.theme}
      blocks={fromPublicBlocks(page.blocks)}
      showFooterBadge={page.seo?.showFooterBadge}
      footerBadgeText={page.seo?.footerBadgeText}
    />
  );
}
