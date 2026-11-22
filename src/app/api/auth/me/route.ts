import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth-local";
import { getSessionToken } from "@/lib/cloudbase-server-auth";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const token = getSessionToken(request);
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401, headers });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401, headers });
  }

  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      displayName: session.displayName,
    },
  }, { headers });
}
