export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* ignore */ }
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = makeSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: palettes, error } = await supabase
      .from("palettes").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ palettes: palettes || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = makeSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: subscription } = await supabase.from("subscriptions").select("plan, status")
      .eq("user_id", user.id).eq("app", "palettai").single();
    const isPro = subscription?.plan === "pro" && subscription?.status === "active";
    if (!isPro) return NextResponse.json({ error: "Pro required to save palettes." }, { status: 403 });

    const body = await request.json();
    const { paletteName, colors, description, name } = body;
    if (!paletteName || !Array.isArray(colors) || colors.length === 0) {
      return NextResponse.json({ error: "paletteName and colors are required." }, { status: 400 });
    }

    const { data: palette, error } = await supabase.from("palettes").insert({
      user_id: user.id, name: name || paletteName, colors,
      prompt: description || "", created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ palette }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
