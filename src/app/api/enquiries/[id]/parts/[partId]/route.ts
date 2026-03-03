import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  const { id: _enquiryId, partId } = await params;
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { part_name, price, cost_price, supplier_available_date } = body as {
    part_name?: string | null;
    price?: number | null;
    cost_price?: number | null;
    supplier_available_date?: string | null;
  };

  const updates: {
    part_name?: string | null;
    price?: number | null;
    cost_price?: number | null;
    supplier_available_date?: string | null;
  } = {};
  if (part_name !== undefined) updates.part_name = part_name ?? null;
  if (price !== undefined) updates.price = price;
  if (cost_price !== undefined) updates.cost_price = cost_price;
  if (supplier_available_date !== undefined) updates.supplier_available_date = supplier_available_date ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("enquiry_parts")
    .update(updates)
    .eq("id", partId)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  const { partId } = await params;
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("enquiry_parts")
    .delete()
    .eq("id", partId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
