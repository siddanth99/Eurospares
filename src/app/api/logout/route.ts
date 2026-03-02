import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  await supabase.auth.signOut();

  const res = NextResponse.json({ ok: true }, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
