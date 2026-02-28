export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@repo/auth";
import { cookies } from "next/headers";

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient(cookieStore as any) as any;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ subscription: null });
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("app", "metatagz")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[subscription] Supabase error:", error);
    }

    return NextResponse.json({ subscription: subscription || null });
  } catch (err) {
    console.error("[subscription] Error:", err);
    return NextResponse.json({ subscription: null });
  }
}
