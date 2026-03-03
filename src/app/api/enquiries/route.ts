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
    .select("*, enquiry_parts(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((row: Record<string, unknown>) => {
    const parts = (row.enquiry_parts ?? []) as { created_at?: string }[];
    parts.sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    );
    return {
      ...row,
      parts,
      enquiry_parts: undefined,
    };
  });

  const res = NextResponse.json(normalized, { status: 200 });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}

type PartInput = {
  part_name?: string | null;
  price?: number | null;
  cost_price?: number | null;
  supplier_available_date?: string | null;
};

export async function POST(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    car_model,
    customer_name,
    customer_phone,
    notes,
    requested_date,
    parts,
  } = body as {
    car_model?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    notes?: string | null;
    requested_date?: string | null;
    parts?: PartInput[];
  };

  const { data: enquiry, error: enquiryError } = await supabase
    .from("enquiries")
    .insert({
      car_model: car_model ?? null,
      customer_name: customer_name ?? null,
      customer_phone: customer_phone ?? null,
      notes: notes ?? null,
      requested_date: requested_date ?? null,
      status: "new",
    })
    .select()
    .single();

  if (enquiryError || !enquiry) {
    return NextResponse.json(
      { error: (enquiry as { message?: string })?.message ?? enquiryError?.message ?? "Failed to create enquiry" },
      { status: 500 }
    );
  }

  const enquiryId = (enquiry as { id: string }).id;
  const partsList = Array.isArray(parts) && parts.length > 0
    ? parts
    : [{ part_name: null, price: null, cost_price: null, supplier_available_date: null }];

  const partRows = partsList.map((p: PartInput) => ({
    enquiry_id: enquiryId,
    part_name: p.part_name ?? null,
    price: p.price ?? null,
    cost_price: p.cost_price ?? null,
    supplier_available_date: p.supplier_available_date ?? null,
  }));

  const { data: insertedParts, error: partsError } = await supabase
    .from("enquiry_parts")
    .insert(partRows)
    .select();

  if (partsError) {
    return NextResponse.json(
      { error: partsError.message },
      { status: 500 }
    );
  }

  const res = NextResponse.json(
    { ...enquiry, parts: insertedParts ?? [] },
    { status: 200 }
  );
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
