// Single source of truth for the Sanity data source: project, query, and URL helpers.
// The Sanity query API is public for reads BUT enforces a CORS allowlist, so it is only
// ever called server-side (from the build script, which sends no Origin header).

export const SANITY_PROJECT = 'qzmxemyn';
export const SANITY_DATASET = 'production';
export const SANITY_API_VERSION = 'v2021-10-21';

/** Festival window: covers the verified 2026-05-10 .. 2026-06-28 range (inclusive). */
export const FESTIVAL_WINDOW = { from: '2026-05-01', to: '2026-07-01' } as const;

/**
 * One request fetches every festival event with all references dereferenced server-side,
 * so the browser never has to touch (or be allowed by) Sanity.
 */
export const EVENTS_QUERY = `*[_type == "event"
  && startdate >= "${FESTIVAL_WINDOW.from}"
  && startdate < "${FESTIVAL_WINDOW.to}"
] | order(startdate asc) {
  _id,
  title,
  "slug": slug.current,
  startdate,
  enddate,
  blurb,
  "descBlocks": description[_type == "block"]{ "spans": children[].text },
  organizer,
  contact,
  eventWebsite,
  ageLimit,
  official,
  "image": image{ "ref": asset._ref, alt },
  "category": category->{ Identifier, "en": DisplayName.en, "no": DisplayName.no },
  "accessibility": accessibility[]->{ Identifier, "en": DisplayName.en, "no": DisplayName.no },
  "location": {
    "address": location.address,
    "venue": location.venue->name,
    "arena": location.arena->name,
    "arenaAddress": location.arena->address
  }
}`;

/** Build the cached (apicdn) query URL. */
export function sanityQueryUrl(query: string): string {
  return `https://${SANITY_PROJECT}.apicdn.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(
    query,
  )}`;
}

/** Resolve a Sanity image asset _ref ("image-<hash>-<WxH>-<ext>") to a CDN URL. */
export function sanityImageUrl(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const m = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref);
  if (!m) return null;
  return `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/${m[1]}-${m[2]}.${m[3]}`;
}
