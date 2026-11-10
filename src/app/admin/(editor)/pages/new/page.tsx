import { Metadata } from "next";
import { getNewPageEditorData } from "@/features/pages/queries";
import { PageEditor } from "@/features/pages/components/editor/page-editor";

export const metadata: Metadata = {
  title: "Tạo trang hồ sơ mới | Gờ Cafe Admin",
  description: "Cấu hình giao diện, nội dung và xuất bản trang hồ sơ Gờ Cafe mới",
};

export const instant = false;

export default async function AdminNewPageEditorRoute() {
  const editorData = await getNewPageEditorData();

  return <PageEditor initialData={editorData} isNew={true} />;
}
