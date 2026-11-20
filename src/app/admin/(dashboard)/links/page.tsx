import { requireWorkspace } from "@/features/workspace/context";
import { hasRole } from "@/features/workspace/types";
import { getLinks } from "@/features/links/queries";
import { LinksTable } from "@/features/links/components/links-table";
import { PageHeader } from "@/components/ui/page-header";

export const instant = false;

export default async function AdminLinksPage() {
  const { role } = await requireWorkspace();
  const links = await getLinks();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Danh mục liên kết chung"
        description="Quản lý tập trung các liên kết (Website, Hotline, Email) được tái sử dụng trên toàn bộ trang hồ sơ."
      />
      <LinksTable initialLinks={links} canEdit={hasRole(role, "editor")} />
    </div>
  );
}
