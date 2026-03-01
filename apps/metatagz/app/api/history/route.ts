export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: checks, error } = await supabase
      .from("meta_checks")
      .select("id, url, results, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[history] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    const history = (checks ?? []).map((check) => {
      const results = check.results as Record<string, unknown> | null;
      const og = results?.og as Record<string, string> | undefined;
      return {
        id: check.id,
        url: check.url,
        checked_at: check.created_at,
        title: (results?.title as string) || "",
        favicon: (results?.favicon as string) || "",
        og_image: og?.image || "",
      };
    });

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[history] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
