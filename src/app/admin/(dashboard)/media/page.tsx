import { requireWorkspace } from "@/features/workspace/context";
import { hasRole } from "@/features/workspace/types";
import { getMediaAssets } from "@/features/media/queries";
import { MediaGrid } from "@/features/media/components/media-grid";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;

export default async function AdminMediaPage() {
  const { role } = await requireWorkspace();
  const assets = await getMediaAssets();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Kho hình ảnh & Media"
        description="Lưu trữ tập trung hình ảnh đại diện, banner và icon dùng chung cho các trang hồ sơ."
      />
      <MediaGrid initialAssets={assets} canEdit={hasRole(role, "editor")} />
    </div>
  );
}
