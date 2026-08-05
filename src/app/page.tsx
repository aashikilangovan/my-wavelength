import {
  getDiscoveryTimeline,
  getListeningHeatmap,
  getMonthlyActivity,
  getOverviewStats,
  getRankTrends,
  getRecentPlays,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
  type RankTrend,
  type TimeRangeKey,
} from "@/lib/queries";
import { StatCard } from "@/components/StatCard";
import { TopItems } from "@/components/TopItems";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { TopAlbums } from "@/components/TopAlbums";
import { DiscoveryTimeline } from "@/components/DiscoveryTimeline";
import { MonthlyActivity } from "@/components/MonthlyActivity";
import { RecentlyPlayed } from "@/components/RecentlyPlayed";
import { NowPlaying } from "@/components/NowPlaying";
import { Reveal } from "@/components/Reveal";
import { EqualizerBars } from "@/components/EqualizerBars";
import { ClockIcon, FlameIcon, MusicNoteIcon, RepeatIcon, VinylIcon } from "@/components/icons";

export const revalidate = 300;

const RANGES: TimeRangeKey[] = ["4w", "6m", "all"];

function trendsToPlainObject(map: Map<string, RankTrend>): Record<string, RankTrend> {
  return Object.fromEntries(map);
}

export default async function Home() {
  const [stats, heatmap, albums, discovery, monthly, recent, ...rest] = await Promise.all([
    getOverviewStats(),
    getListeningHeatmap(),
    getTopAlbums(),
    getDiscoveryTimeline(),
    getMonthlyActivity(),
    getRecentPlays(),
    ...RANGES.map((r) => getTopTracks(r)),
    ...RANGES.map((r) => getTopArtists(r)),
    ...RANGES.map((r) => getRankTrends("track", r)),
    ...RANGES.map((r) => getRankTrends("artist", r)),
  ]);

  const tracksByRange = Object.fromEntries(
    RANGES.map((r, i) => [r, rest[i]]),
  ) as Record<TimeRangeKey, Awaited<ReturnType<typeof getTopTracks>>>;
  const artistsByRange = Object.fromEntries(
    RANGES.map((r, i) => [r, rest[RANGES.length + i]]),
  ) as Record<TimeRangeKey, Awaited<ReturnType<typeof getTopArtists>>>;
  const trackTrendsByRange = Object.fromEntries(
    RANGES.map((r, i) => [r, trendsToPlainObject(rest[RANGES.length * 2 + i] as Map<string, RankTrend>)]),
  ) as Record<TimeRangeKey, Record<string, RankTrend>>;
  const artistTrendsByRange = Object.fromEntries(
    RANGES.map((r, i) => [r, trendsToPlainObject(rest[RANGES.length * 3 + i] as Map<string, RankTrend>)]),
  ) as Record<TimeRangeKey, Record<string, RankTrend>>;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="bg-gradient-to-r from-accent via-accent2 to-violet bg-clip-text font-display text-2xl font-semibold tracking-tight text-transparent">
              My Wavelength
            </h1>
            <EqualizerBars />
          </div>
          <p className="text-sm text-muted">A running record of what I&apos;ve been playing.</p>
        </div>
        <NowPlaying />
      </header>

      <Reveal>
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Minutes tracked" value={stats.totalMinutes} icon={<ClockIcon />} accent="accent" />
          <StatCard label="Unique tracks" value={stats.uniqueTracks} icon={<MusicNoteIcon />} accent="violet" />
          <StatCard label="Unique artists" value={stats.uniqueArtists} icon={<VinylIcon />} accent="accent2" />
          <StatCard
            label="Current streak"
            value={stats.streakDays}
            suffix="d"
            icon={<FlameIcon />}
            accent="accent"
            hint={stats.streakDays > 0 ? "days with a play, back to back" : undefined}
          />
          <StatCard
            label="Longest streak"
            value={stats.longestStreakDays}
            suffix="d"
            icon={<FlameIcon />}
            accent="accent2"
            hint="personal record"
          />
          <StatCard
            label="Loop factor"
            value={stats.loopFactor}
            decimals={1}
            suffix="x"
            icon={<RepeatIcon />}
            accent="violet"
            hint="plays per unique track"
          />
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <TopItems
          tracksByRange={tracksByRange}
          artistsByRange={artistsByRange}
          trackTrendsByRange={trackTrendsByRange}
          artistTrendsByRange={artistTrendsByRange}
        />
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

      <Reveal delay={0.18}>
        <MonthlyActivity months={monthly} />
      </Reveal>

      <Reveal delay={0.2}>
        <RecentlyPlayed plays={recent} />
      </Reveal>

      <footer className="py-6 text-center text-xs text-muted">
        Built with Next.js, Turso, and the Spotify Web API.
      </footer>
    </div>
  );
}
