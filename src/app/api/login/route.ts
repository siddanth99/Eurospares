import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const res = NextResponse.json({ user: data.user }, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
