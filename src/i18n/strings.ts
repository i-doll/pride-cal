import type { Lang } from '../lib/types';

// UI chrome strings. Event titles/descriptions are NOT translated (single-language in the
// CMS); only the interface and the bilingual category/accessibility labels switch.
const en = {
  appTitle: 'Oslo Pride 2026',
  tagline: 'Browse the programme and export to your own calendar',
  updated: 'Updated {date}',
  loading: 'Loading events…',
  errorTitle: 'Could not load events',
  errorBody: 'Something went wrong loading the programme.',
  retry: 'Try again',
  searchPlaceholder: 'Search events…',
  allDays: 'All days',
  category: 'Category',
  venue: 'Stage',
  arena: 'Arena',
  accessibility: 'Accessibility',
  allCategories: 'All categories',
  allVenues: 'All stages',
  allArenas: 'All arenas',
  officialOnly: 'Official only',
  englishFriendly: 'In English',
  clearFilters: 'Clear filters',
  results: '{n} events',
  noResults: 'No events match your filters.',
  selectAllDay: 'Select all',
  select: 'Select',
  selectedCount: '{n} selected',
  download: 'Download .ics',
  addGoogle: 'Add to Google Calendar',
  clearSelection: 'Clear',
  subscribe: 'Subscribe',
  subscribeTitle: 'Subscribe to a live calendar',
  subscribeBody:
    'Add an auto-updating calendar. Use the Subscribe button in Apple Calendar/Outlook, the Google button in Google Calendar, or copy the link.',
  wholeFestival: 'Whole festival',
  copy: 'Copy link',
  copied: 'Copied!',
  close: 'Close',
  allAges: 'All ages',
  locationTba: 'Location TBA',
  organizer: 'Organizer',
  ageLimit: 'Age limit',
  moreInfo: 'Event website',
  viewOnOslopride: 'View on oslopride.no',
  official: 'Official',
  approxEnd: 'End time is approximate',
  skipToContent: 'Skip to content',
};

export type StringKey = keyof typeof en;

const no: Record<StringKey, string> = {
  appTitle: 'Oslo Pride 2026',
  tagline: 'Bla gjennom programmet og eksporter til din egen kalender',
  updated: 'Oppdatert {date}',
  loading: 'Laster arrangementer…',
  errorTitle: 'Kunne ikke laste arrangementer',
  errorBody: 'Noe gikk galt under lasting av programmet.',
  retry: 'Prøv igjen',
  searchPlaceholder: 'Søk i arrangementer…',
  allDays: 'Alle dager',
  category: 'Kategori',
  venue: 'Scene',
  arena: 'Arena',
  accessibility: 'Tilgjengelighet',
  allCategories: 'Alle kategorier',
  allVenues: 'Alle scener',
  allArenas: 'Alle arenaer',
  officialOnly: 'Kun offisielle',
  englishFriendly: 'På engelsk',
  clearFilters: 'Nullstill filtre',
  results: '{n} arrangementer',
  noResults: 'Ingen arrangementer passer filtrene dine.',
  selectAllDay: 'Velg alle',
  select: 'Velg',
  selectedCount: '{n} valgt',
  download: 'Last ned .ics',
  addGoogle: 'Legg til i Google Kalender',
  clearSelection: 'Tøm',
  subscribe: 'Abonner',
  subscribeTitle: 'Abonner på en oppdatert kalender',
  subscribeBody:
    'Legg til en kalender som oppdaterer seg selv. Bruk Abonner-knappen i Apple Kalender/Outlook, Google-knappen i Google Kalender, eller kopier lenken.',
  wholeFestival: 'Hele festivalen',
  copy: 'Kopier lenke',
  copied: 'Kopiert!',
  close: 'Lukk',
  allAges: 'Alle aldre',
  locationTba: 'Sted kommer',
  organizer: 'Arrangør',
  ageLimit: 'Aldersgrense',
  moreInfo: 'Nettside',
  viewOnOslopride: 'Se på oslopride.no',
  official: 'Offisielt',
  approxEnd: 'Sluttiden er omtrentlig',
  skipToContent: 'Hopp til innhold',
};

const dicts: Record<Lang, Record<StringKey, string>> = { en, no };

export function t(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
