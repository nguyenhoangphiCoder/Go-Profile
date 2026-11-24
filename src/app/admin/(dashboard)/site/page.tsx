import { FeatureLockedNotice } from "@/components/admin/feature-locked-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getSiteConfigData } from "@/features/site/queries";
import { SiteConfigClient } from "@/features/site/components/site-config-client";
import { requireWorkspace } from "@/features/workspace/context";
import { canUseWorkspaceFeature, FEATURE_DISABLED_MESSAGES } from "@/features/workspace/guards";

export const metadata = {
  title: "Cấu hình Website | Gờ Cafe Admin",
};

export const instant = false;

interface AdminSitePageProps {
  searchParams: Promise<{ shell?: string }>;
}

export default async function AdminSitePage({ searchParams }: AdminSitePageProps) {
  const ctx = await requireWorkspace();
  if (!canUseWorkspaceFeature(ctx, "landing")) {
    return (
      <FeatureLockedNotice
        title="Cấu hình Website chưa được kích hoạt"
        message={FEATURE_DISABLED_MESSAGES.landing}
        workspaceName={ctx.workspace.name}
        plan={ctx.workspace.plan}
      />
    );
  }

  const { shell } = await searchParams;
  const data = await getSiteConfigData(shell);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Cấu hình Website"
        description="Tạo và quản lý nhiều bộ Menu 2 cấp, Header, Footer và nút nổi riêng biệt cho từng nhóm Landing Page trong cùng Workspace."
      />
      <SiteConfigClient key={data.activeShellId} initialData={data} />
    </div>
  );
}
