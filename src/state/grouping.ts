import type { DayMeta, Facets, PrideEvent } from '../lib/types';

export interface DayGroup {
  dayKey: string;
  events: PrideEvent[];
}

export function groupByDay(events: PrideEvent[]): DayGroup[] {
  const map = new Map<string, PrideEvent[]>();
  for (const e of events) {
    const arr = map.get(e.dayKey) ?? [];
    arr.push(e);
    map.set(e.dayKey, arr);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([dayKey, evs]) => ({ dayKey, events: evs }));
}

/** Derive filter option lists + festival days from the full event set (computed once). */
export function buildFacets(events: PrideEvent[]): Facets {
  const cats = new Map<string, { id: string; no: string; en: string }>();
  const venues = new Set<string>();
  const arenas = new Set<string>();
  const access = new Map<string, { id: string; no: string; en: string }>();
  const days = new Map<string, number>();

  for (const e of events) {
    if (e.category) cats.set(e.category.id, { id: e.category.id, no: e.category.no, en: e.category.en });
    if (e.location.venue) venues.add(e.location.venue);
    if (e.location.arena) arenas.add(e.location.arena);
    for (const a of e.accessibility) access.set(a.id, { id: a.id, no: a.no, en: a.en });
    if (e.dayKey) days.set(e.dayKey, (days.get(e.dayKey) ?? 0) + 1);
  }

  const byNo = (a: { no: string }, b: { no: string }) => a.no.localeCompare(b.no, 'nb');
  const dayMetas: DayMeta[] = [...days.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([dayKey, count]) => ({ dayKey, count }));

  return {
    categories: [...cats.values()].sort(byNo),
    venues: [...venues].sort((a, b) => a.localeCompare(b, 'nb')),
    arenas: [...arenas].sort((a, b) => a.localeCompare(b, 'nb')),
    access: [...access.values()].sort(byNo),
    days: dayMetas,
  };
}
