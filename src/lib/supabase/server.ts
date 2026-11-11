import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import type { Database } from "@/types/database.generated";
import { clientEnv } from "@/lib/env.client";

export async function createSupabaseServerClient() {
  try {
    await connection();
  } catch (error: unknown) {
    // Bắt buộc ném lại các tín hiệu nội bộ của Next.js (dynamic usage, hanging promise khi
    // prerender, prerender interrupted...). Nếu nuốt chúng, truy vấn Supabase sẽ chạy trong lúc
    // prerender, bị hủy giữa chừng và trang công khai bị render thành "Không tìm thấy".
    unstable_rethrow(error);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
