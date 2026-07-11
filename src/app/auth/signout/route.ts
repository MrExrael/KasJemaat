import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Logout terprogram (mis. dari paksa-logout user nonaktif).
 * Route Handler dapat menulis cookie, jadi sesi benar-benar dibersihkan.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const redirectUrl = new URL("/login", request.url);
  const reason = new URL(request.url).searchParams.get("reason");
  if (reason) {
    redirectUrl.searchParams.set("error", reason);
  }

  return NextResponse.redirect(redirectUrl);
}
