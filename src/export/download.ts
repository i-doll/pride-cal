import type { PrideEvent } from '../lib/types';
import { assembleCalendar, toIcsEvent } from '../lib/ics';

/** Build a multi-event .ics from the selection and trigger a download in the browser. */
export function downloadIcs(events: PrideEvent[], filename = 'oslo-pride-2026.ics'): void {
  const ics = assembleCalendar(events.map(toIcsEvent), { now: new Date().toISOString() });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // Firefox requires the anchor to be in the document
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
