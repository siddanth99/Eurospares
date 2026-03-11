import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { createServerClientForRoute } from "@/src/lib/supabase/route-handler";

const EXTRACT_SYSTEM_PROMPT = `Extract structured spare parts enquiry data.

Return JSON:

{
  "car_model": string,
  "parts": [{ "part_name": string, "oe_number": string | null }]
}

Rules:
- Detect car make and model.
- Extract part names.
- Multiple parts allowed.
- If no car model detected return empty string.
- For each extracted part also suggest ONE likely OEM part number if possible. If unknown return null.
- Return JSON only.`;

type ExtractedPart = { part_name: string; oe_number: string | null };
type ExtractedPayload = { car_model: string; parts: ExtractedPart[] };

function parseExtractPayload(raw: unknown): ExtractedPayload {
  if (raw == null || typeof raw !== "object") {
    return { car_model: "", parts: [] };
  }
  const obj = raw as Record<string, unknown>;
  const car_model =
    typeof obj.car_model === "string" ? obj.car_model : "";
  let parts: ExtractedPart[] = [];
  if (Array.isArray(obj.parts)) {
    parts = obj.parts
      .filter((p): p is Record<string, unknown> => p != null && typeof p === "object")
      .map((p) => {
        const part_name = typeof p.part_name === "string" ? p.part_name.trim() : String(p.part_name ?? "").trim();
        const oe_number = p.oe_number === null || p.oe_number === undefined
          ? null
          : typeof p.oe_number === "string"
            ? (p.oe_number.trim() || null)
            : null;
        return { part_name, oe_number };
      })
      .filter((p) => p.part_name.length > 0);
  }
  return { car_model, parts };
}

export async function POST(request: NextRequest) {
  const { supabase, cookiesToSet } = await createServerClientForRoute(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let message: string;
  let imageFile: File | null = null;
  try {
    const formData = await request.formData();
    const messageValue = formData.get("message");
    message = typeof messageValue === "string" ? messageValue.trim() : "";
    const imageValue = formData.get("image");
    imageFile = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  if (!message && !imageFile) {
    return NextResponse.json(
      { error: "message or image is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API not configured" },
      { status: 500 }
    );
  }

  let userContent: { role: "user"; content: string | { type: string; text?: string; image_url?: { url: string } }[] };
  if (imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mediaType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mediaType};base64,${base64}`;
    const contentParts: { type: string; text?: string; image_url?: { url: string } }[] = [];
    if (message) {
      contentParts.push({ type: "text", text: message });
    }
    contentParts.push({ type: "image_url", image_url: { url: dataUrl } });
    userContent = { role: "user", content: contentParts };
  } else {
    userContent = { role: "user", content: message };
  }

  let openaiRes: Response;
  try {
    openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EXTRACT_SYSTEM_PROMPT },
          userContent,
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch (err) {
    console.error("OpenAI request failed:", err);
    return NextResponse.json(
      { error: "Extraction service unavailable" },
      { status: 502 }
    );
  }

  if (!openaiRes.ok) {
    const errBody = await openaiRes.text();
    console.error("OpenAI error:", openaiRes.status, errBody);
    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 502 }
    );
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = await openaiRes.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid extraction response" },
      { status: 502 }
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "No extraction result" },
      { status: 502 }
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "Invalid extraction result" },
      { status: 502 }
    );
  }

  const payload = parseExtractPayload(raw);
  console.log("EXTRACT_API_RESPONSE", payload);

  const res = NextResponse.json(
    {
      car_model: payload.car_model,
      parts: payload.parts.map((p) => ({
        part_name: p.part_name,
        oe_number: p.oe_number,
      })),
    },
    { status: 200 }
  );
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" });
  });
  return res;
}
