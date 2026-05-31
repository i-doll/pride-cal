// Normalizes a raw Sanity event row (from the GROQ projection in groq.ts) into a clean,
// denormalized PrideEvent. Shared by the build script; pure and isomorphic.

import type { Localized, PrideEvent } from './types';
import { sanityImageUrl } from './groq';

/** Shape returned by the GROQ projection (loosely typed; data is dirty in places). */
export interface SanityEventRow {
  _id?: string;
  title?: string | null;
  slug?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  blurb?: string | null;
  descBlocks?: Array<{ spans?: Array<string | null> | null }> | null;
  organizer?: string | null;
  contact?: string | null;
  eventWebsite?: string | null;
  ageLimit?: string | null;
  official?: boolean | null;
  image?: { ref?: string | null; alt?: string | null } | null;
  category?: RawLocalized | null;
  accessibility?: RawLocalized[] | null;
  location?: {
    address?: string | null;
    venue?: string | null;
    arena?: string | null;
    arenaAddress?: string | null;
  } | null;
}

interface RawLocalized {
  Identifier?: string | null;
  en?: string | null;
  no?: string | null;
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2h fallback when enddate is missing/invalid
const OSLO_DAY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Oslo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "ativitiesForChildren" / "alcohol Free" -> "Ativities For Children" / "Alcohol Free". */
function humanize(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Stable url/file-safe slug from a raw Identifier (typos preserved deterministically). */
function slugify(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Robust bilingual label. DisplayName.en is unreliable (typos, sometimes null), so fall
 * back to a humanized Identifier, then Norwegian. The id/slug keep the raw Identifier.
 */
function toLocalized(d: RawLocalized | null | undefined): Localized | null {
  if (!d) return null;
  const id = (d.Identifier ?? '').toString();
  const en = (d.en ?? '').trim();
  const no = (d.no ?? '').trim();
  if (!id && !en && !no) return null;
  return {
    id,
    slug: slugify(id) || 'unknown',
    en: en || humanize(id) || no || 'Unknown',
    no: no || en || humanize(id) || 'Ukjent',
  };
}

function extractDescription(blocks: SanityEventRow['descBlocks']): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((b) =>
      Array.isArray(b?.spans)
        ? b.spans.filter((s): s is string => typeof s === 'string').join('')
        : '',
    )
    .join('\n\n')
    .trim();
}

function osloDayKey(iso: string): string {
  return OSLO_DAY_FMT.format(new Date(iso)); // 'YYYY-MM-DD'
}

export function normalizeEvent(raw: SanityEventRow): PrideEvent {
  const id = (raw._id ?? '').toString();
  const slug = (raw.slug ?? '').toString();
  const title = (raw.title ?? '').toString().trim() || '(uten tittel)';

  const start = (raw.startdate ?? '').toString();
  const startMs = Date.parse(start);
  let end = (raw.enddate ?? '').toString();
  const endMs = end ? Date.parse(end) : NaN;
  let endIsEstimated = false;
  if (!end || Number.isNaN(endMs) || Number.isNaN(startMs) || endMs <= startMs) {
    end = new Date((Number.isNaN(startMs) ? 0 : startMs) + DEFAULT_DURATION_MS).toISOString();
    endIsEstimated = true;
  }

  const category = toLocalized(raw.category);
  const accessibility = Array.isArray(raw.accessibility)
    ? raw.accessibility.map(toLocalized).filter((x): x is Localized => x !== null)
    : [];
  const isEnglishFriendly = accessibility.some((a) => a.id.toLowerCase() === 'english');

  const venue = raw.location?.venue ?? null;
  const arena = raw.location?.arena ?? null;
  const address = raw.location?.address ?? raw.location?.arenaAddress ?? null;
  const name = venue ?? arena ?? null;
  const display = name && address ? `${name}, ${address}` : (name ?? address ?? null);

  const imageUrl = sanityImageUrl(raw.image?.ref);
  const image = imageUrl ? { url: imageUrl, alt: (raw.image?.alt ?? '').toString() } : null;

  const blurb = (raw.blurb ?? '').toString().trim();
  const description = extractDescription(raw.descBlocks);
  const organizer = (raw.organizer ?? '').toString().trim();

  const searchParts = [
    title,
    blurb,
    organizer,
    venue ?? '',
    arena ?? '',
    category?.no ?? '',
    category?.en ?? '',
  ];
  const searchText = searchParts.join(' ').toLowerCase();

  return {
    id,
    title,
    slug,
    url: slug ? `https://www.oslopride.no/events/${slug}` : '',
    start,
    end,
    endIsEstimated,
    dayKey: start ? osloDayKey(start) : '',
    blurb,
    description,
    organizer,
    contact: (raw.contact ?? '').toString().trim() || null,
    website: (raw.eventWebsite ?? '').toString().trim() || null,
    ageLimitRaw: (raw.ageLimit ?? '').toString().trim(),
    official: raw.official === true,
    image,
    category,
    accessibility,
    isEnglishFriendly,
    location: { display, venue, arena, address },
    searchText,
  };
}
