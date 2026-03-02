import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { env } from "@/src/lib/env";

export async function createServerClientForRoute(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];
  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.push(...list);
        },
      },
    }
  );
  return { supabase, cookiesToSet };
}
