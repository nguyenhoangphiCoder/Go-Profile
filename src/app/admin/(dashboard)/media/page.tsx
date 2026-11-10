import { getMediaAssets } from "@/features/media/queries";
import { MediaGrid } from "@/features/media/components/media-grid";

export const instant = false;

export default async function AdminMediaPage() {
  const assets = await getMediaAssets();

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kho hình ảnh & Media</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Lưu trữ tập trung các hình ảnh logo, icon liên kết, avatar và banner được phục vụ qua CDN
          của Supabase Storage.
        </p>
      </div>

      {/* Grid */}
      <MediaGrid initialAssets={assets} />
    </div>
  );
}
