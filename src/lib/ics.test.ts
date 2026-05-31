import { describe, it, expect } from 'vitest';
import {
  toIcsUtc,
  escapeText,
  foldLine,
  uidFor,
  assembleCalendar,
  googleCalendarUrl,
  type IcsEvent,
} from './ics';

const sample: IcsEvent = {
  id: 'abc123',
  slug: 'opening-ceremony',
  title: 'Opening Ceremony',
  start: '2026-06-17T16:00:00.000Z',
  end: '2026-06-17T18:00:00.000Z',
  locationText: 'Rådhusplassen, Oslo',
  descriptionText: 'Kickoff; with music, dancing & joy.',
  url: 'https://www.oslopride.no/events/opening-ceremony',
};

/** Reverse RFC 5545 line folding: a CRLF followed by a single space/tab is a continuation. */
function unfold(s: string): string {
  return s.replace(/\r\n[ \t]/g, '');
}

function byteLen(s: string): number {
  return new TextEncoder().encode(s).length;
}

describe('toIcsUtc', () => {
  it('formats ISO UTC to RFC 5545 basic form', () => {
    expect(toIcsUtc('2026-06-21T12:00:00.000Z')).toBe('20260621T120000Z');
  });
  it('throws on invalid input', () => {
    expect(() => toIcsUtc('not-a-date')).toThrow();
  });
});

describe('escapeText', () => {
  it('escapes backslash, semicolon, comma and newline (in order)', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });
  it('strips disallowed control characters', () => {
    expect(escapeText('a\x07b')).toBe('ab');
  });
});

describe('foldLine', () => {
  it('leaves short lines untouched', () => {
    expect(foldLine('SUMMARY:hi')).toBe('SUMMARY:hi');
  });

  it('folds long ASCII lines into <=75 octet segments that unfold to the original', () => {
    const original = 'DESCRIPTION:' + 'x'.repeat(300);
    const folded = foldLine(original);
    expect(folded).not.toBe(original);
    for (const seg of folded.split('\r\n')) expect(byteLen(seg)).toBeLessThanOrEqual(75);
    expect(unfold(folded)).toBe(original);
  });

  it('never splits a multi-byte codepoint (Norwegian + emoji)', () => {
    const original = 'SUMMARY:' + 'å'.repeat(60) + '🎉'.repeat(10);
    const folded = foldLine(original);
    for (const seg of folded.split('\r\n')) expect(byteLen(seg)).toBeLessThanOrEqual(75);
    // No U+FFFD replacement chars => no codepoint was cut.
    expect(folded).not.toContain('�');
    expect(unfold(folded)).toBe(original);
  });
});

describe('uidFor', () => {
  it('is stable and derived from the slug', () => {
    expect(uidFor(sample)).toBe('opening-ceremony@oslopride.no');
  });
  it('falls back to id when slug is missing', () => {
    expect(uidFor({ ...sample, slug: null })).toBe('abc123@oslopride.no');
  });
});

describe('assembleCalendar', () => {
  const ics = assembleCalendar([sample], { now: '2026-05-31T10:00:00.000Z' });

  it('wraps events in a valid VCALENDAR/VEVENT with CRLF endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('VERSION:2.0\r\n');
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('END:VEVENT\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('emits stable UID and UTC datetimes', () => {
    expect(ics).toContain('UID:opening-ceremony@oslopride.no');
    expect(ics).toContain('DTSTART:20260617T160000Z');
    expect(ics).toContain('DTEND:20260617T180000Z');
  });

  it('escapes TEXT values but not the URL', () => {
    expect(unfold(ics)).toContain('DESCRIPTION:Kickoff\\; with music\\, dancing & joy.');
    expect(ics).toContain('URL:https://www.oslopride.no/events/opening-ceremony');
  });

  it('adds feed metadata only in feed flavor', () => {
    const feed = assembleCalendar([sample], { now: '2026-05-31T10:00:00.000Z', feed: { name: 'Oslo Pride 2026' } });
    expect(feed).toContain('METHOD:PUBLISH');
    expect(feed).toContain('X-WR-CALNAME:Oslo Pride 2026');
    expect(feed).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT24H');
    expect(ics).not.toContain('METHOD:PUBLISH');
  });
});

describe('googleCalendarUrl', () => {
  const url = googleCalendarUrl(sample);
  it('builds a TEMPLATE link with encoded title, UTC dates, location and details', () => {
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get('action')).toBe('TEMPLATE');
    expect(q.get('text')).toBe('Opening Ceremony');
    expect(q.get('dates')).toBe('20260617T160000Z/20260617T180000Z');
    expect(q.get('location')).toBe('Rådhusplassen, Oslo');
    expect(q.get('details')).toContain('oslopride.no/events/opening-ceremony');
  });
});
