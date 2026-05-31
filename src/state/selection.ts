import { LS_SELECTION } from '../config';
import { debounce } from '../util/dom';

export function loadSelection(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_SELECTION);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.filter((x): x is string => typeof x === 'string'));
    }
  } catch {
    /* private mode / corrupt value */
  }
  return new Set();
}

export const persistSelection = debounce((selected: Set<string>): void => {
  try {
    localStorage.setItem(LS_SELECTION, JSON.stringify([...selected]));
  } catch {
    /* ignore */
  }
}, 300);
