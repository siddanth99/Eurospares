import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { part_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const part_name = typeof body.part_name === "string" ? body.part_name.trim() : "";
  if (!part_name) {
    const res = NextResponse.json({ suggestions: [] }, { status: 200 });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
    });
    return res;
  }

  const { data: rows, error } = await supabase
    .from("enquiry_parts")
    .select("oe_number")
    .not("oe_number", "is", null)
    .ilike("part_name", `%${part_name}%`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const countByOe = new Map<string, number>();
  for (const row of rows ?? []) {
    const oe = row.oe_number;
    if (typeof oe === "string" && oe.trim()) {
      countByOe.set(oe, (countByOe.get(oe) ?? 0) + 1);
    }
  }

  const suggestions = Array.from(countByOe.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([oe]) => oe);

  const res = NextResponse.json({ suggestions }, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
