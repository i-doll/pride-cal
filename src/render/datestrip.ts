import type { AppState } from '../lib/types';
import { t } from '../i18n/strings';
import { dayKeyToIso, fmtChip } from '../util/datetime';
import { escapeHtml } from '../util/dom';

export function renderDateStrip(s: AppState, counts: Map<string, number>): string {
  const allChip = `<button type="button" class="daychip${
    !s.filters.dayKey ? ' is-active' : ''
  }" data-action="set-day" data-day="" aria-pressed="${!s.filters.dayKey}">
      <span class="daychip__wd">${escapeHtml(t(s.lang, 'allDays'))}</span>
      <span class="daychip__count">${s.events.length}</span>
    </button>`;

  const chips = s.facets.days
    .map((d) => {
      const c = counts.get(d.dayKey) ?? 0;
      const { weekday, day } = fmtChip(dayKeyToIso(d.dayKey), s.lang);
      const active = s.filters.dayKey === d.dayKey;
      const dim = c === 0 ? ' is-dim' : '';
      return `<button type="button" class="daychip${active ? ' is-active' : ''}${dim}"
        data-action="set-day" data-day="${escapeHtml(d.dayKey)}" aria-pressed="${active}"${c === 0 ? ' disabled' : ''}>
        <span class="daychip__wd">${escapeHtml(weekday)}</span>
        <span class="daychip__day">${escapeHtml(day)}</span>
        <span class="daychip__count">${c}</span>
      </button>`;
    })
    .join('');

  return `<div class="datestrip__inner">${allChip}${chips}</div>`;
}
