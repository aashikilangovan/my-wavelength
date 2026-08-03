import { NextResponse } from "next/server";
import { fetchCurrentlyPlaying } from "@/lib/spotify";

export async function GET() {
  try {
    const current = await fetchCurrentlyPlaying();
    return NextResponse.json(current);
  } catch {
    // Missing Spotify credentials or a transient API error — the widget
    // just hides itself rather than surfacing an error to visitors.
    return NextResponse.json({ isPlaying: false, track: null, progressMs: null });
  }
}
