import {
  getDiscoveryTimeline,
  getListeningHeatmap,
  getOverviewStats,
  getRecentPlays,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
  type TimeRangeKey,
} from "@/lib/queries";
import { StatCard } from "@/components/StatCard";
import { TopItems } from "@/components/TopItems";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { TopAlbums } from "@/components/TopAlbums";
import { DiscoveryTimeline } from "@/components/DiscoveryTimeline";
import { RecentlyPlayed } from "@/components/RecentlyPlayed";
import { NowPlaying } from "@/components/NowPlaying";
import { Reveal } from "@/components/Reveal";

export const revalidate = 300;

const RANGES: TimeRangeKey[] = ["4w", "6m", "all"];

export default async function Home() {
  const [stats, heatmap, albums, discovery, recent, ...rest] = await Promise.all([
    getOverviewStats(),
    getListeningHeatmap(),
    getTopAlbums(),
    getDiscoveryTimeline(),
    getRecentPlays(),
    ...RANGES.map((r) => getTopTracks(r)),
    ...RANGES.map((r) => getTopArtists(r)),
  ]);

  const tracksByRange = Object.fromEntries(
    RANGES.map((r, i) => [r, rest[i]]),
  ) as Record<TimeRangeKey, Awaited<ReturnType<typeof getTopTracks>>>;
  const artistsByRange = Object.fromEntries(
    RANGES.map((r, i) => [r, rest[RANGES.length + i]]),
  ) as Record<TimeRangeKey, Awaited<ReturnType<typeof getTopArtists>>>;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-accent to-violet bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            My Wavelength
          </h1>
          <p className="text-sm text-muted">A running record of what I&apos;ve been playing.</p>
        </div>
        <NowPlaying />
      </header>

      <Reveal>
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Minutes tracked" value={stats.totalMinutes} />
          <StatCard label="Unique tracks" value={stats.uniqueTracks} />
          <StatCard label="Unique artists" value={stats.uniqueArtists} />
          <StatCard
            label="Current streak"
            value={stats.streakDays}
            suffix="d"
            hint={stats.streakDays > 0 ? "days with a play, back to back" : undefined}
          />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <TopItems tracksByRange={tracksByRange} artistsByRange={artistsByRange} />
      </Reveal>

      <Reveal delay={0.1}>
        <ActivityHeatmap cells={heatmap} />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal delay={0.15}>
          <TopAlbums albums={albums} />
        </Reveal>
        <Reveal delay={0.15}>
          <DiscoveryTimeline weeks={discovery} />
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <RecentlyPlayed plays={recent} />
      </Reveal>

      <footer className="py-6 text-center text-xs text-muted">
        Built with Next.js, Turso, and the Spotify Web API.
      </footer>
    </div>
  );
}
