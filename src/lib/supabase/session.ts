import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.generated";
import { clientEnv } from "@/lib/env.client";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Bỏ qua gọi Supabase Auth ở các request prefetch ngầm (layout/page vẫn tự kiểm tra quyền)
  if (
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch"
  ) {
    return response;
  }

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Xác thực JWT cục bộ bằng getClaims() (~1ms, không tốn vòng gọi mạng tới Auth server)
  const { data: claimsData } = await supabase.auth.getClaims();
  const hasUser = Boolean(claimsData?.claims?.sub);

  const { pathname } = request.nextUrl;
  const isAccessingAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAccessingLogin = request.nextUrl.pathname === "/login";

  // Không chuyển hướng các request không phải GET (ví dụ Server Actions POST)
  if (request.method !== "GET") {
    return response;
  }

  // Nếu chưa đăng nhập mà truy cập /admin/* -> chuyển hướng về /login
  if (isAccessingAdmin && !hasUser) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Nếu đã đăng nhập mà vào lại /login -> chuyển hướng thẳng vào /admin
  if (isAccessingLogin && hasUser) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
