// Build-time data generator. Runs in Node (via tsx) with NO Origin header, so Sanity's
// CORS allowlist does not apply. Fetches the festival, normalizes, and writes:
//   public/events.json           (the denormalized dataset the app loads)
//   public/feeds/all.ics         (whole-festival subscribe feed)
//   public/feeds/<category>.ics  (one subscribe feed per category)
//   public/feeds/index.json      (manifest of available feeds)
//
// Robustness: validate-then-write. Any failure (HTTP error, empty/too-small result) exits
// non-zero WITHOUT touching the committed last-good files, so CI skips the deploy and the
// previous good site stays live.

import { mkdir, writeFile } from 'node:fs/promises';
import { EVENTS_QUERY, FESTIVAL_WINDOW, SANITY_DATASET, sanityQueryUrl } from '../src/lib/groq';
import { normalizeEvent, type SanityEventRow } from '../src/lib/normalize';
import { assembleCalendar, toIcsEvent } from '../src/lib/ics';
import type { EventsEnvelope, PrideEvent } from '../src/lib/types';

const MIN_EVENTS = 50; // sanity floor (expect ~361); guards against a partial/broken query
const FETCH_TIMEOUT_MS = 20_000;
const RETRIES = 3;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchEventsOnce(): Promise<PrideEvent[]> {
  const url = sanityQueryUrl(EVENTS_QUERY);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Sanity HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { result?: unknown };
  if (!Array.isArray(json.result)) throw new Error('Sanity response: result is not an array');
  return (json.result as SanityEventRow[]).map(normalizeEvent);
}

async function fetchEvents(): Promise<PrideEvent[]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await fetchEventsOnce();
    } catch (err) {
      lastErr = err;
      console.warn(`fetch attempt ${attempt}/${RETRIES} failed: ${(err as Error).message}`);
      if (attempt < RETRIES) await delay(1000 * attempt);
    }
  }
  throw lastErr;
}

async function main(): Promise<void> {
  const events = await fetchEvents();
  if (events.length < MIN_EVENTS) {
    throw new Error(`Refusing to write: only ${events.length} events (< ${MIN_EVENTS})`);
  }

  // Warn (don't fail) on duplicate UID keys — they would collapse in subscribers.
  const seen = new Set<string>();
  for (const e of events) {
    const key = e.slug || e.id;
    if (seen.has(key)) console.warn(`Duplicate slug/id (UID collision risk): ${key}`);
    seen.add(key);
  }

  const now = new Date().toISOString();
  const envelope: EventsEnvelope = {
    generatedAt: now,
    source: `sanity:${SANITY_DATASET}`,
    window: { from: FESTIVAL_WINDOW.from, to: FESTIVAL_WINDOW.to },
    count: events.length,
    events,
  };

  await mkdir('public', { recursive: true });
  await writeFile('public/events.json', JSON.stringify(envelope) + '\n', 'utf8');
  console.log(`Wrote public/events.json (${events.length} events)`);

  // Feeds.
  await mkdir('public/feeds', { recursive: true });
  await writeFile(
    'public/feeds/all.ics',
    assembleCalendar(events.map(toIcsEvent), { now, feed: { name: 'Oslo Pride 2026' } }),
    'utf8',
  );

  const byCategory = new Map<string, PrideEvent[]>();
  for (const e of events) {
    if (!e.category) continue;
    const arr = byCategory.get(e.category.slug) ?? [];
    arr.push(e);
    byCategory.set(e.category.slug, arr);
  }

  const index: Array<{ slug: string; file: string; no: string; en: string; count: number }> = [];
  for (const [slug, evs] of byCategory) {
    const cat = evs[0].category!;
    const file = `${slug}.ics`;
    await writeFile(
      `public/feeds/${file}`,
      assembleCalendar(evs.map(toIcsEvent), { now, feed: { name: `Oslo Pride 2026 – ${cat.no}` } }),
      'utf8',
    );
    index.push({ slug, file, no: cat.no, en: cat.en, count: evs.length });
  }
  index.sort((a, b) => b.count - a.count);

  await writeFile(
    'public/feeds/index.json',
    JSON.stringify({ generatedAt: now, all: 'all.ics', categories: index }, null, 2) + '\n',
    'utf8',
  );
  console.log(`Wrote ${index.length} category feeds + index.json`);
}

main().catch((err) => {
  console.error('generate failed:', err);
  process.exit(1);
});
