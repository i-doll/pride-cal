import type { AppState } from '../lib/types';
import { dayKeyToIso, fmtChip } from '../util/datetime';
import { escapeHtml } from '../util/dom';

export interface StripDay {
  dayKey: string;
  count: number;
}

/**
 * Sticky day navigator. Chips jump the agenda to a day (not a filter); `viewingDay` is the
 * scroll-spy highlight for the day currently in view. Only days present in the (filtered)
 * agenda are shown, so every chip has a scroll target.
 */
export function renderDateStrip(s: AppState, days: StripDay[], viewingDay: string | null): string {
  const chips = days
    .map((d) => {
      const { weekday, day } = fmtChip(dayKeyToIso(d.dayKey), s.lang);
      const active = d.dayKey === viewingDay;
      return `<button type="button" class="daychip${active ? ' is-active' : ''}"
        data-action="goto-day" data-day="${escapeHtml(d.dayKey)}" aria-current="${active ? 'date' : 'false'}">
        <span class="daychip__wd">${escapeHtml(weekday)}</span>
        <span class="daychip__day">${escapeHtml(day)}</span>
        <span class="daychip__count">${d.count}</span>
      </button>`;
    })
    .join('');
  return `<div class="datestrip__inner">${chips}</div>`;
}
