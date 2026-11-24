import { requireWorkspace } from "@/features/workspace/context";
import { GuideClient } from "@/features/guide/components/guide-client";

export const instant = false;

export const metadata = {
  title: "Hướng dẫn sử dụng chi tiết | Quản trị CMS",
  description:
    "Cẩm nang hướng dẫn từng menu, từng chức năng, từng form nhập liệu và 26 loại khối dễ hiểu nhất cho người dùng.",
};

export default async function AdminGuidePage() {
  const { workspace, isPlatformAdmin } = await requireWorkspace();

  return (
    <div className="max-w-6xl mx-auto">
      <GuideClient workspaceName={workspace.name} isPlatformAdmin={isPlatformAdmin} />
    </div>
  );
}
