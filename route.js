import { NextResponse } from "next/server";
import { store } from "../../../lib/store.js";

export const dynamic = "force-dynamic";

// POST /api/swipe  { profileId, direction: "like" | "pass" } -> { match, profile }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { status, body: result } = store.swipe(body?.profileId, body?.direction);
  return NextResponse.json(result, { status });
}
