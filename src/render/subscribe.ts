import type { AppState, Lang } from '../lib/types';
import { t } from '../i18n/strings';
import { escapeHtml } from '../util/dom';
import { feedUrls, googleSubscribeUrl } from '../export/feeds';

export function renderSubscribe(s: AppState): string {
  if (!s.subscribeOpen) return '';

  const rows = [feedRow(t(s.lang, 'wholeFestival'), 'all.ics', s.events.length, s.lang)];
  if (s.feeds) {
    for (const c of s.feeds.categories) {
      rows.push(feedRow(s.lang === 'no' ? c.no : c.en, c.file, c.count, s.lang));
    }
  }

  return `
    <div class="modal" data-modal>
      <div class="modal__panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(
        t(s.lang, 'subscribeTitle'),
      )}" data-stop tabindex="-1">
        <div class="modal__head">
          <h2 class="modal__title">${escapeHtml(t(s.lang, 'subscribeTitle'))}</h2>
          <button type="button" class="modal__close" data-action="close-subscribe" aria-label="${escapeHtml(
            t(s.lang, 'close'),
          )}">×</button>
        </div>
        <p class="modal__intro">${escapeHtml(t(s.lang, 'subscribeBody'))}</p>
        <ul class="feedlist" role="list">${rows.join('')}</ul>
      </div>
    </div>`;
}

function feedRow(name: string, file: string, count: number, lang: Lang): string {
  const { https, webcal } = feedUrls(file);
  return `<li class="feed">
      <div class="feed__name">${escapeHtml(name)} <span class="feed__count">${count}</span></div>
      <div class="feed__links">
        <a class="btn btn--small btn--primary" href="${escapeHtml(webcal)}">${escapeHtml(t(lang, 'subscribe'))}</a>
        <a class="btn btn--small btn--ghost" href="${escapeHtml(
          googleSubscribeUrl(https),
        )}" target="_blank" rel="noopener">Google</a>
        <button type="button" class="btn btn--small btn--ghost" data-action="copy" data-copy="${escapeHtml(
          https,
        )}">${escapeHtml(t(lang, 'copy'))}</button>
      </div>
    </li>`;
}
