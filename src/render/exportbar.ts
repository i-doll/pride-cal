import type { AppState } from '../lib/types';
import { t } from '../i18n/strings';
import { escapeHtml } from '../util/dom';

export function renderExportBar(s: AppState): string {
  const n = s.selected.size;
  const has = n > 0;
  return `
    <div class="exportbar__inner${has ? '' : ' is-empty'}">
      <div class="exportbar__count" role="status" aria-live="polite">
        <strong>${escapeHtml(t(s.lang, 'selectedCount', { n }))}</strong>
        ${has ? `<button type="button" class="link" data-action="clear-selection">${escapeHtml(t(s.lang, 'clearSelection'))}</button>` : ''}
      </div>
      <div class="exportbar__actions">
        <button type="button" class="btn btn--primary" data-action="download"${has ? '' : ' disabled'}>${escapeHtml(
          t(s.lang, 'download'),
        )}</button>
        <button type="button" class="btn btn--ghost" data-action="open-subscribe">${escapeHtml(t(s.lang, 'subscribe'))}</button>
      </div>
    </div>`;
}
