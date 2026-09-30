import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=oauth_callback_failed`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);

    return NextResponse.redirect(
      `${origin}/login?error=oauth_callback_failed`
    );
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}