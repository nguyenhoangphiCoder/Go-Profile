import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageEditorData } from "@/features/pages/queries";
import { PageEditor } from "@/features/pages/components/editor/page-editor";

export const metadata: Metadata = {
  title: "Trình biên tập trang hồ sơ | Gờ Cafe Admin",
  description: "Tùy biến nội dung, giao diện và xuất bản trang hồ sơ Gờ Cafe",
};

export const instant = false;

interface PageEditorRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPageEditorRoute({ params }: PageEditorRouteProps) {
  const { id } = await params;
  const editorData = await getPageEditorData(id);

  if (!editorData) {
    notFound();
  }

  return <PageEditor initialData={editorData} />;
}
