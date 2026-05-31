import type { Lang } from '../lib/types';
import { OSLO_TZ } from '../config';

// All event datetimes are UTC instants; we always display them in Europe/Oslo, formatted
// per the active UI language. Formatters are cached (constructing Intl.DateTimeFormat is
// relatively expensive).

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + '|' + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: OSLO_TZ });
    cache.set(key, f);
  }
  return f;
}

const locale = (lang: Lang): string => (lang === 'no' ? 'nb-NO' : 'en-GB');

export function fmtTime(iso: string, lang: Lang): string {
  return fmt(locale(lang), { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

export function fmtTimeRange(startIso: string, endIso: string, lang: Lang): string {
  return `${fmtTime(startIso, lang)}–${fmtTime(endIso, lang)}`;
}

export function fmtDayHeading(iso: string, lang: Lang): string {
  return fmt(locale(lang), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
}

export function fmtChip(iso: string, lang: Lang): { weekday: string; day: string } {
  return {
    weekday: fmt(locale(lang), { weekday: 'short' }).format(new Date(iso)),
    day: fmt(locale(lang), { day: 'numeric', month: 'short' }).format(new Date(iso)),
  };
}

export function fmtDate(iso: string, lang: Lang): string {
  return fmt(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/** Noon-UTC anchor for a 'YYYY-MM-DD' Oslo day key (safe for weekday/label formatting). */
export function dayKeyToIso(dayKey: string): string {
  return `${dayKey}T12:00:00.000Z`;
}

/** Today's date as a 'YYYY-MM-DD' day key in Europe/Oslo. */
export function osloTodayKey(): string {
  return fmt('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
