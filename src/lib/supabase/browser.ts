import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.generated";
import { clientEnv } from "@/lib/env.client";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
