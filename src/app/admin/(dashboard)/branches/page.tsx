import { FeatureLockedNotice } from "@/components/admin/feature-locked-notice";
import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspace } from "@/features/workspace/context";
import { canUseWorkspaceFeature, FEATURE_DISABLED_MESSAGES } from "@/features/workspace/guards";
import { hasRole } from "@/features/workspace/types";
import { getBranchesList } from "@/features/branches/queries";
import { BranchesClient } from "@/features/branches/components/branches-client";

export const metadata = {
  title: "Hệ thống chi nhánh | Gờ Cafe Admin",
};

export const instant = false;

export default async function AdminBranchesPage() {
  const ctx = await requireWorkspace();
  if (!canUseWorkspaceFeature(ctx, "branches")) {
    return (
      <FeatureLockedNotice
        title="Hệ thống chi nhánh chưa được kích hoạt"
        message={FEATURE_DISABLED_MESSAGES.branches}
        workspaceName={ctx.workspace.name}
        plan={ctx.workspace.plan}
      />
    );
  }

  const branches = await getBranchesList();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Hệ thống chi nhánh"
        description="Quản lý danh sách cửa hàng (tự tách tọa độ từ link Google Maps, import CSV hàng loạt) đồng bộ trực tiếp lên bản đồ tương tác 2 chiều."
      />
      <BranchesClient initialBranches={branches} canEdit={hasRole(ctx.role, "editor")} />
    </div>
  );
}
