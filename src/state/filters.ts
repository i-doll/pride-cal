import type { Filters, PrideEvent } from '../lib/types';

export function emptyFilters(): Filters {
  return {
    dayKey: null,
    categoryId: null,
    venueName: null,
    arenaName: null,
    accessIds: [],
    englishOnly: false,
    officialOnly: false,
    search: '',
  };
}

export function filtersActive(f: Filters): boolean {
  return Boolean(
    f.dayKey ||
      f.categoryId ||
      f.venueName ||
      f.arenaName ||
      f.accessIds.length ||
      f.englishOnly ||
      f.officialOnly ||
      f.search.trim(),
  );
}

/** Pure client-side filter over the full event list. */
export function applyFilters(events: PrideEvent[], f: Filters): PrideEvent[] {
  const terms = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return events.filter(
    (e) =>
      (!f.dayKey || e.dayKey === f.dayKey) &&
      (!f.categoryId || e.category?.id === f.categoryId) &&
      (!f.venueName || e.location.venue === f.venueName) &&
      (!f.arenaName || e.location.arena === f.arenaName) &&
      (!f.officialOnly || e.official) &&
      (!f.englishOnly || e.isEnglishFriendly) &&
      f.accessIds.every((a) => e.accessibility.some((x) => x.id === a)) &&
      terms.every((term) => e.searchText.includes(term)),
  );
}

/** Same filters minus the day, used to compute per-day counts for the date strip. */
export function withoutDay(f: Filters): Filters {
  return { ...f, dayKey: null };
}
