import { FeatureLockedNotice } from "@/components/admin/feature-locked-notice";
import { requireWorkspace } from "@/features/workspace/context";
import { canUseWorkspaceFeature, FEATURE_DISABLED_MESSAGES } from "@/features/workspace/guards";
import { hasRole } from "@/features/workspace/types";
import { getLeadsList } from "@/features/leads/queries";
import { LeadsClient } from "@/features/leads/components/leads-client";

export const instant = false;

export const metadata = {
  title: "Khách hàng tiềm năng (Leads) | Quản trị Gờ Café",
};

export default async function AdminLeadsPage() {
  const ctx = await requireWorkspace();
  if (!canUseWorkspaceFeature(ctx, "leads")) {
    return (
      <FeatureLockedNotice
        title="Quản lý Khách hàng (Leads) chưa được kích hoạt"
        message={FEATURE_DISABLED_MESSAGES.leads}
        workspaceName={ctx.workspace.name}
        plan={ctx.workspace.plan}
      />
    );
  }

  const leads = await getLeadsList();

  return (
    <div className="max-w-6xl mx-auto">
      <LeadsClient initialLeads={leads} canEdit={hasRole(ctx.role, "editor")} />
    </div>
  );
}
