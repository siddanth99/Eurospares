import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json(data ?? [], { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}

export async function POST(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { car_model, part_name, customer_name, customer_phone, notes } = body as {
    car_model?: string | null;
    part_name?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    notes?: string | null;
  };

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      car_model: car_model ?? null,
      part_name: part_name ?? null,
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
      notes: notes ?? null,
      status: "new",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json(data, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
