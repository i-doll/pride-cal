import type { AppState, Lang } from '../lib/types';
import { t } from '../i18n/strings';
import { escapeHtml } from '../util/dom';
import { fmtDate } from '../util/datetime';

export function renderHeader(s: AppState): string {
  const updated = s.generatedAt
    ? `<span class="header__updated">${escapeHtml(t(s.lang, 'updated', { date: fmtDate(s.generatedAt, s.lang) }))}</span>`
    : '';
  return `
    <a class="skiplink" href="#agenda">${escapeHtml(t(s.lang, 'skipToContent'))}</a>
    <div class="header__bar">
      <div class="header__brand">
        <span class="header__flag" aria-hidden="true"></span>
        <span class="header__titles">
          <span class="header__title">${escapeHtml(t(s.lang, 'appTitle'))}</span>
          <span class="header__tagline">${escapeHtml(t(s.lang, 'tagline'))}</span>
        </span>
      </div>
      <div class="header__right">
        ${updated}
        <div class="langtoggle" role="group" aria-label="Language / Språk">
          ${langButton('no', s.lang)}${langButton('en', s.lang)}
        </div>
      </div>
    </div>`;
}

function langButton(lang: Lang, active: Lang): string {
  const on = lang === active;
  return `<button type="button" class="langtoggle__btn${on ? ' is-active' : ''}" data-action="set-lang" data-lang="${lang}" aria-pressed="${on}">${lang.toUpperCase()}</button>`;
}
