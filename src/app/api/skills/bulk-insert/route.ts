import { NextResponse } from "next/server";

/** One-time imports must never be reachable through a public server-privileged API. */
export async function POST() {
  return NextResponse.json({ error: "This one-time import endpoint has been retired." }, { status: 410 });
}
