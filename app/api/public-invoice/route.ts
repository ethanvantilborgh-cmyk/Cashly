import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyShareToken } from "../share-invoice/route";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getAdmin();
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const parsed = verifyShareToken(token);
  if (!parsed) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { id, uid } = parsed;

  const { data: inv, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .single();

  if (invErr || !inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();

  return NextResponse.json({ invoice: inv, profile });
}
