// Shared types for both the Node build script and the browser app.

export type Lang = 'no' | 'en';

/** A bilingual label (category, accessibility feature). */
export interface Localized {
  id: string; // raw Sanity Identifier (stable key)
  slug: string; // url/file-safe slug derived from Identifier
  en: string; // best English label (with fallback chain)
  no: string; // Norwegian label
}

/** One fully denormalized event, as written to events.json and consumed by the app. */
export interface PrideEvent {
  id: string; // Sanity _id
  title: string;
  slug: string; // slug.current ("" if absent)
  url: string; // canonical oslopride.no page ("" if no slug)
  start: string; // ISO 8601 UTC
  end: string; // ISO 8601 UTC (= start + 2h when source enddate missing)
  endIsEstimated: boolean;
  dayKey: string; // 'YYYY-MM-DD' in Europe/Oslo (build-computed)
  blurb: string;
  description: string; // plaintext extracted from Portable Text
  organizer: string;
  contact: string | null;
  website: string | null; // eventWebsite
  ageLimitRaw: string; // "0" | "18" | "20" | "99" | ""
  official: boolean;
  image: { url: string; alt: string } | null;
  category: Localized | null;
  accessibility: Localized[];
  isEnglishFriendly: boolean; // accessibility contains the "english" tag
  location: {
    display: string | null; // composed "venue, address" (null when nothing known)
    venue: string | null;
    arena: string | null;
    address: string | null;
  };
  searchText: string; // lowercased haystack incl. both language category labels
}

export interface EventsEnvelope {
  generatedAt: string; // ISO UTC, stamped by the build script
  source: string; // "sanity:production"
  window: { from: string; to: string };
  count: number;
  events: PrideEvent[];
}

export interface Filters {
  dayKey: string | null;
  categoryId: string | null;
  venueName: string | null;
  arenaName: string | null;
  accessIds: string[]; // AND semantics
  englishOnly: boolean;
  officialOnly: boolean;
  search: string;
}

export interface DayMeta {
  dayKey: string;
  count: number;
}

export interface Facets {
  categories: Array<{ id: string; no: string; en: string }>;
  venues: string[];
  arenas: string[];
  access: Array<{ id: string; no: string; en: string }>;
  days: DayMeta[];
}

export interface FeedIndex {
  generatedAt: string;
  all: string;
  categories: Array<{ slug: string; file: string; no: string; en: string; count: number }>;
}

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  lang: Lang;
  generatedAt: string | null;
  events: PrideEvent[];
  byId: Map<string, PrideEvent>;
  facets: Facets;
  filters: Filters;
  selected: Set<string>;
  expandedId: string | null;
  subscribeOpen: boolean;
  feeds: FeedIndex | null;
  errorMessage: string | null;
}
