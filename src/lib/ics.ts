// RFC 5545 iCalendar generation. Pure & isomorphic (Date, TextEncoder/Decoder,
// URLSearchParams only) so it runs identically in the Node build script (subscribe feeds)
// and the browser (bulk download). Source datetimes are UTC, emitted as UTC `Z` — every
// conforming client renders them in the viewer's local zone.

import type { PrideEvent } from './types';

/** Minimal contract ics.ts operates on. PrideEvent maps to it via toIcsEvent(). */
export interface IcsEvent {
  id: string;
  slug: string | null;
  title: string;
  start: string; // ISO UTC
  end: string; // ISO UTC (guaranteed >= start by normalize)
  locationText: string;
  descriptionText: string;
  url: string | null;
}

export function toIcsEvent(e: PrideEvent): IcsEvent {
  return {
    id: e.id,
    slug: e.slug || null,
    title: e.title,
    start: e.start,
    end: e.end,
    locationText: e.location.display ?? '',
    descriptionText: e.description || e.blurb || '',
    url: e.url || null,
  };
}

const CRLF = '\r\n';
const PRODID = '-//Oslo Pride 2026 unofficial//pride-cal//EN';

/** "2026-06-21T12:00:00.000Z" -> "20260621T120000Z" (RFC 5545 UTC form). */
export function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`ics: invalid date "${iso}"`);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/** Escape a TEXT value (RFC 5545 §3.3.11). Order matters: backslash first. */
export function escapeText(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip disallowed control chars
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Fold a content line to <=75 octets (RFC 5545 §3.1). Continuation lines start with a
 * single space and are 74 octets of content (space + 74 = 75). Never splits a UTF-8
 * codepoint.
 */
export function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const dec = new TextDecoder();
  const out: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back up so we never cut inside a multi-byte sequence (continuation bytes: 10xxxxxx).
    if (end < bytes.length) {
      while (end > start && (bytes[end] & 0xc0) === 0x80) end--;
    }
    out.push(dec.decode(bytes.subarray(start, end)));
    start = end;
    limit = 74;
  }
  return out.join(CRLF + ' ');
}

function prop(name: string, value: string, escape = false): string {
  return foldLine(`${name}:${escape ? escapeText(value) : value}`);
}

/** Stable UID across rebuilds so subscribers update events in place (no duplicates). */
export function uidFor(e: IcsEvent): string {
  const base = (e.slug ?? e.id).trim() || e.id || 'event';
  return `${base}@oslopride.no`;
}

export function buildVEvent(e: IcsEvent, now: string): string[] {
  const lines = ['BEGIN:VEVENT'];
  lines.push(prop('UID', uidFor(e)));
  lines.push(prop('DTSTAMP', toIcsUtc(now)));
  lines.push(prop('DTSTART', toIcsUtc(e.start)));
  lines.push(prop('DTEND', toIcsUtc(e.end)));
  lines.push(prop('SUMMARY', e.title, true));
  if (e.locationText) lines.push(prop('LOCATION', e.locationText, true));
  if (e.descriptionText) lines.push(prop('DESCRIPTION', e.descriptionText, true));
  if (e.url) lines.push(prop('URL', e.url)); // URI value: fold, do not escape
  lines.push('END:VEVENT');
  return lines;
}

export interface CalendarOpts {
  now: string; // ISO, for DTSTAMP
  feed?: { name: string }; // present => subscribe-feed flavor
}

export function assembleCalendar(events: IcsEvent[], opts: CalendarOpts): string {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', prop('PRODID', PRODID), 'CALSCALE:GREGORIAN'];
  if (opts.feed) {
    L.push('METHOD:PUBLISH');
    L.push(prop('X-WR-CALNAME', opts.feed.name, true));
    L.push('X-WR-TIMEZONE:Europe/Oslo');
    L.push('REFRESH-INTERVAL;VALUE=DURATION:PT24H');
    L.push('X-PUBLISHED-TTL:PT24H');
  }
  for (const e of events) L.push(...buildVEvent(e, opts.now));
  L.push('END:VCALENDAR');
  return L.join(CRLF) + CRLF; // every line (incl. last) terminated by CRLF
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…';
}

/** Per-event "Add to Google Calendar" template link. */
export function googleCalendarUrl(e: IcsEvent, moreLabel = 'More'): string {
  const dates = `${toIcsUtc(e.start)}/${toIcsUtc(e.end)}`;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates });
  const parts: string[] = [];
  if (e.descriptionText) parts.push(e.descriptionText);
  if (e.url) parts.push(`\n${moreLabel}: ${e.url}`);
  const details = truncate(parts.join(''), 1200);
  if (details) params.set('details', details);
  if (e.locationText) params.set('location', e.locationText);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
