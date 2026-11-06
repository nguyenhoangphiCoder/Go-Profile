import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
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
