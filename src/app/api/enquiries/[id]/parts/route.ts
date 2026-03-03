import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: enquiryId } = await params;
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const raw = body as Record<string, unknown>;
  const part_name = raw.part_name;
  if (part_name !== null && typeof part_name !== "string") {
    return NextResponse.json(
      { error: "part_name must be a string" },
      { status: 400 }
    );
  }
  const price =
    raw.price !== undefined && raw.price !== null
      ? Number(raw.price)
      : null;
  if (price !== null && !Number.isFinite(price)) {
    return NextResponse.json(
      { error: "price must be a number or null" },
      { status: 400 }
    );
  }
  const cost_price =
    raw.cost_price !== undefined && raw.cost_price !== null
      ? Number(raw.cost_price)
      : null;
  if (cost_price !== null && !Number.isFinite(cost_price)) {
    return NextResponse.json(
      { error: "cost_price must be a number or null" },
      { status: 400 }
    );
  }
  const supplier_available_date = raw.supplier_available_date;
  if (
    supplier_available_date !== undefined &&
    supplier_available_date !== null &&
    typeof supplier_available_date !== "string"
  ) {
    return NextResponse.json(
      { error: "supplier_available_date must be a string or null" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("enquiry_parts")
    .insert({
      enquiry_id: enquiryId,
      part_name: part_name ?? null,
      price,
      cost_price,
      supplier_available_date:
        supplier_available_date == null || supplier_available_date === ""
          ? null
          : String(supplier_available_date),
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
