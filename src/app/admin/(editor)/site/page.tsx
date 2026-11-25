import { FeatureLockedNotice } from "@/components/admin/feature-locked-notice";
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-xl w-full">
          <FeatureLockedNotice
            title="Cấu hình Website chưa được kích hoạt"
            message={FEATURE_DISABLED_MESSAGES.landing}
            workspaceName={ctx.workspace.name}
            plan={ctx.workspace.plan}
          />
        </div>
      </div>
    );
  }

  const { shell } = await searchParams;
  const data = await getSiteConfigData(shell);

  return <SiteConfigClient key={data.activeShellId} initialData={data} />;
}
