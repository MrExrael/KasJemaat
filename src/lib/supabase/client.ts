import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Supabase client untuk Client Component (browser).
 * Membaca env publik yang di-inline saat build.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
