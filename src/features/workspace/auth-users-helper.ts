import "server-only";
import type { User } from "@supabase/supabase-js";
import type { createSupabaseAdminClient } from "@/lib/supabase/privileged";

type AdminDb = ReturnType<typeof createSupabaseAdminClient>;

const PER_PAGE = 200;
const MAX_PAGES = 50; // Tối đa 10.000 người dùng cho mỗi lượt quét an toàn

/**
 * Liệt kê toàn bộ auth.users có phân trang (khắc phục giới hạn 200 user của trang 1).
 */
export async function listAllAuthUsers(db: AdminDb): Promise<User[]> {
  if (typeof db.auth?.admin?.listUsers !== "function") return [];

  const all: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data?.users?.length) break;
    all.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }
  return all;
}
