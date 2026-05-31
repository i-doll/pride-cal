import type { AppState, Lang, Localized, PrideEvent } from '../lib/types';
import { t } from '../i18n/strings';
import { escapeHtml } from '../util/dom';
import { fmtTimeRange } from '../util/datetime';
import { fmtAgeLimit } from '../i18n/lang';
import { ACCESS_ICON } from './icons';
import { googleCalendarUrl, toIcsEvent } from '../lib/ics';

export function renderRow(s: AppState, e: PrideEvent): string {
  const { lang } = s;
  const checked = s.selected.has(e.id);
  const expanded = s.expandedId === e.id;
  const cat = e.category ? (lang === 'no' ? e.category.no : e.category.en) : '';
  const loc = e.location.display ?? t(lang, 'locationTba');
  const meta = [escapeHtml(loc), cat ? escapeHtml(cat) : ''].filter(Boolean).join(' · ');
  const access = e.accessibility.map((a) => accessPill(a, lang)).join('');
  const approx = e.endIsEstimated
    ? ` <span class="event__approx" title="${escapeHtml(t(lang, 'approxEnd'))}" aria-label="${escapeHtml(
        t(lang, 'approxEnd'),
      )}">~</span>`
    : '';
  const official = e.official ? ` <span class="badge badge--official">${escapeHtml(t(lang, 'official'))}</span>` : '';

  return `
    <li class="event${expanded ? ' is-expanded' : ''}" data-id="${escapeHtml(e.id)}">
      <div class="event__row">
        <label class="event__check">
          <input type="checkbox" data-action="toggle" data-id="${escapeHtml(e.id)}"${checked ? ' checked' : ''}
            aria-label="${escapeHtml(`${t(lang, 'select')}: ${e.title}`)}" />
        </label>
        <button type="button" class="event__main" data-action="expand" data-id="${escapeHtml(e.id)}" aria-expanded="${expanded}">
          <span class="event__time">${escapeHtml(fmtTimeRange(e.start, e.end, lang))}${approx}</span>
          <span class="event__body">
            <span class="event__title">${escapeHtml(e.title)}${official}</span>
            <span class="event__meta">${meta}${access ? ` <span class="event__access">${access}</span>` : ''}</span>
          </span>
          <span class="event__chevron" aria-hidden="true">›</span>
        </button>
      </div>
      ${expanded ? renderDetail(s, e) : ''}
    </li>`;
}

function accessPill(a: Localized, lang: Lang): string {
  const labelTxt = lang === 'no' ? a.no : a.en;
  const content = ACCESS_ICON[a.slug] ?? labelTxt.slice(0, 2).toUpperCase();
  return `<span class="pill" title="${escapeHtml(labelTxt)}" aria-label="${escapeHtml(labelTxt)}">${escapeHtml(
    content,
  )}</span>`;
}

function renderDetail(s: AppState, e: PrideEvent): string {
  const { lang } = s;
  const gcal = googleCalendarUrl(toIcsEvent(e), t(lang, 'moreInfo'));
  const text = e.description || e.blurb || '';
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const facts: string[] = [];
  if (e.organizer) facts.push(fact(t(lang, 'organizer'), escapeHtml(e.organizer)));
  const age = fmtAgeLimit(e.ageLimitRaw, lang);
  if (age) facts.push(fact(t(lang, 'ageLimit'), escapeHtml(age)));
  const factsDl = facts.length ? `<dl class="detail__facts">${facts.join('')}</dl>` : '';

  const img = e.image
    ? `<img class="detail__img" src="${escapeHtml(e.image.url)}?w=760&fit=max&auto=format" alt="${escapeHtml(
        e.image.alt,
      )}" loading="lazy" />`
    : '';

  const links = [
    `<a class="btn btn--primary btn--small" href="${escapeHtml(gcal)}" target="_blank" rel="noopener">${escapeHtml(
      t(lang, 'addGoogle'),
    )}</a>`,
  ];
  if (e.website)
    links.push(
      `<a class="btn btn--ghost btn--small" href="${escapeHtml(e.website)}" target="_blank" rel="noopener">${escapeHtml(
        t(lang, 'moreInfo'),
      )}</a>`,
    );
  if (e.url)
    links.push(
      `<a class="btn btn--ghost btn--small" href="${escapeHtml(e.url)}" target="_blank" rel="noopener">${escapeHtml(
        t(lang, 'viewOnOslopride'),
      )}</a>`,
    );

  return `
    <div class="detail">
      ${img}
      <div class="detail__content">
        ${paras}
        ${factsDl}
        <div class="detail__actions">${links.join('')}</div>
      </div>
    </div>`;
}

function fact(key: string, value: string): string {
  return `<div class="detail__fact"><dt>${escapeHtml(key)}</dt><dd>${value}</dd></div>`;
}
