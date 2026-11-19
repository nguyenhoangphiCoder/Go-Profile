import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";
import { gatePublicSlug } from "@/lib/public-slug-gate";

function needsAuthSession(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/")
  );
}

export async function proxy(request: NextRequest) {
  // Trang công khai /{slug}: trả 404 / 308 thật trước khi render (xem public-slug-gate.ts)
  const gated = await gatePublicSlug(request);
  if (gated) return gated;

  // Chỉ làm mới / kiểm tra phiên đăng nhập ở các đường dẫn cần xác thực;
  // tránh tốn 1 vòng gọi Supabase Auth cho mọi lượt xem trang công khai & redirect /r/[id].
  if (!needsAuthSession(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn ngoại trừ:
     * - _next/static (tệp tĩnh)
     * - _next/image (tối ưu hóa hình ảnh)
     * - favicon.ico, sitemap.xml, robots.txt
     * - các tệp mở rộng thông dụng (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
