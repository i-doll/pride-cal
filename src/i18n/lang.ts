import type { Lang, Localized } from '../lib/types';
import { LS_LANG } from '../config';
import { t } from './strings';

/** Norwegian-first: this is a Norwegian festival, so default to Norwegian unless the user
 *  has explicitly chosen a language before (persisted). Tourists use the header toggle. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LS_LANG);
    if (saved === 'no' || saved === 'en') return saved;
  } catch {
    /* private mode */
  }
  return 'no';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LS_LANG, lang);
  } catch {
    /* ignore */
  }
}

export function label(loc: Localized | null, lang: Lang): string {
  if (!loc) return '';
  return lang === 'no' ? loc.no : loc.en;
}

/** Localized age-limit label. "99" is a CMS sentinel for "unspecified" => render nothing. */
export function fmtAgeLimit(raw: string, lang: Lang): string {
  if (raw === '0') return t(lang, 'allAges');
  if (raw === '99' || raw === '') return '';
  return `${raw}+`;
}
