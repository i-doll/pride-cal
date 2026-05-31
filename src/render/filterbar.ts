import type { AppState } from '../lib/types';
import { t } from '../i18n/strings';
import { escapeHtml } from '../util/dom';

export function renderFilterBar(s: AppState): string {
  const { lang, facets, filters } = s;
  const catName = (c: { no: string; en: string }) => (lang === 'no' ? c.no : c.en);

  const categoryOpts = [
    opt('', t(lang, 'allCategories'), !filters.categoryId),
    ...facets.categories.map((c) => opt(c.id, catName(c), filters.categoryId === c.id)),
  ].join('');
  const venueOpts = [
    opt('', t(lang, 'allVenues'), !filters.venueName),
    ...facets.venues.map((v) => opt(v, v, filters.venueName === v)),
  ].join('');
  const arenaOpts = [
    opt('', t(lang, 'allArenas'), !filters.arenaName),
    ...facets.arenas.map((a) => opt(a, a, filters.arenaName === a)),
  ].join('');

  const accessChips = facets.access
    .map((a) => {
      const on = filters.accessIds.includes(a.id);
      const name = lang === 'no' ? a.no : a.en;
      return `<label class="chip${on ? ' is-on' : ''}"><input type="checkbox" data-filter="access" data-id="${escapeHtml(
        a.id,
      )}"${on ? ' checked' : ''}/> ${escapeHtml(name)}</label>`;
    })
    .join('');

  return `
    <div class="filterbar__row">
      <input type="search" class="filterbar__search" data-filter="search"
        placeholder="${escapeHtml(t(lang, 'searchPlaceholder'))}" value="${escapeHtml(filters.search)}"
        aria-label="${escapeHtml(t(lang, 'searchPlaceholder'))}" autocomplete="off" />
      ${field(t(lang, 'category'), `<select data-filter="category">${categoryOpts}</select>`)}
      ${field(t(lang, 'venue'), `<select data-filter="venue">${venueOpts}</select>`)}
      ${field(t(lang, 'arena'), `<select data-filter="arena">${arenaOpts}</select>`)}
    </div>
    <div class="filterbar__row filterbar__row--toggles">
      <label class="switch"><input type="checkbox" data-filter="english"${
        filters.englishOnly ? ' checked' : ''
      }/> ${escapeHtml(t(lang, 'englishFriendly'))}</label>
      <label class="switch"><input type="checkbox" data-filter="official"${
        filters.officialOnly ? ' checked' : ''
      }/> ${escapeHtml(t(lang, 'officialOnly'))}</label>
      <details class="filterbar__access">
        <summary>${escapeHtml(t(lang, 'accessibility'))}</summary>
        <div class="chips">${accessChips}</div>
      </details>
      <button type="button" class="btn btn--ghost btn--small" data-action="clear-filters">${escapeHtml(
        t(lang, 'clearFilters'),
      )}</button>
    </div>`;
}

function opt(value: string, text: string, selected: boolean): string {
  return `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>${escapeHtml(text)}</option>`;
}

function field(labelText: string, control: string): string {
  return `<label class="filterbar__field"><span class="filterbar__label">${escapeHtml(labelText)}</span>${control}</label>`;
}
