import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

const SECRET = process.env.SHARE_SECRET || "cashly-share-secret";

export function generateShareToken(invoiceId: string, userId: string): string {
  const payload = Buffer.from(JSON.stringify({ id: invoiceId, uid: userId })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyShareToken(token: string): { id: string; uid: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { invoiceId, userId } = await req.json();
  if (!invoiceId || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const token = generateShareToken(invoiceId, userId);
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${token}`;
  return NextResponse.json({ token, url });
}
