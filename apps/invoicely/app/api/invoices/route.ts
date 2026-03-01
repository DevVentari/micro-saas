export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore from Server Component
          }
        },
      },
    }
  );
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, client_name, amount:total_amount, currency, status, created_at, data"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Invoice fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    // Extract issue_date/due_date from data JSONB for display
    const mapped = invoices?.map((inv) => {
      const d = inv.data as Record<string, unknown> | null;
      return {
        ...inv,
        issue_date: d?.issueDate ?? "",
        due_date: d?.dueDate ?? "",
      };
    });

    return NextResponse.json({ invoices: mapped });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      invoice_number,
      client_name,
      issue_date,
      due_date,
      amount,
      currency,
      status,
      data,
    } = body;

    if (!invoice_number) {
      return NextResponse.json(
        { error: "invoice_number is required" },
        { status: 400 }
      );
    }

    // Check if invoice with same number exists for this user, update it
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("user_id", user.id)
      .eq("invoice_number", invoice_number)
      .maybeSingle();

    let result;

    if (existing) {
      const { data: updated, error } = await supabase
        .from("invoices")
        .update({
          client_name,
          total_amount: amount,
          currency,
          status,
          data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      result = updated;
    } else {
      const { data: created, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          invoice_number,
          client_name,
          total_amount: amount,
          currency,
          status: status ?? "draft",
          data,
        })
        .select()
        .single();

      if (error) throw error;
      result = created;
    }

    return NextResponse.json({ invoice: result }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json(
      { error: "Failed to save invoice" },
      { status: 500 }
    );
  }
}
