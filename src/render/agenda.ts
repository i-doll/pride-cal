import type { AppState } from '../lib/types';
import type { DayGroup } from '../state/grouping';
import { t } from '../i18n/strings';
import { escapeHtml } from '../util/dom';
import { dayKeyToIso, fmtDayHeading } from '../util/datetime';
import { renderRow } from './eventrow';

export function renderAgenda(s: AppState, groups: DayGroup[], visibleCount: number): string {
  const head = `<div class="agenda__head"><span class="agenda__count" role="status" aria-live="polite">${escapeHtml(
    t(s.lang, 'results', { n: visibleCount }),
  )}</span></div>`;

  if (groups.length === 0) {
    return `${head}<p class="agenda__empty">${escapeHtml(t(s.lang, 'noResults'))}</p>`;
  }
  return head + groups.map((g) => renderDay(s, g)).join('');
}

function renderDay(s: AppState, g: DayGroup): string {
  const total = g.events.length;
  const selectedInDay = g.events.reduce((n, e) => n + (s.selected.has(e.id) ? 1 : 0), 0);
  const allSelected = total > 0 && selectedInDay === total;

  return `
    <section class="day" id="day-${escapeHtml(g.dayKey)}" data-day="${escapeHtml(g.dayKey)}">
      <div class="day__head">
        <h2 class="day__title">${escapeHtml(fmtDayHeading(dayKeyToIso(g.dayKey), s.lang))}</h2>
        <label class="day__selectall">
          <input type="checkbox" data-action="select-day" data-day="${escapeHtml(g.dayKey)}"${
            allSelected ? ' checked' : ''
          } aria-label="${escapeHtml(t(s.lang, 'selectAllDay'))}" />
          <span>${escapeHtml(t(s.lang, 'selectAllDay'))}</span>
        </label>
      </div>
      <ul class="day__list" role="list">
        ${g.events.map((e) => renderRow(s, e)).join('')}
      </ul>
    </section>`;
}
