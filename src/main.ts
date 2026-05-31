import './styles/main.css';
import type { AppState, Lang, PrideEvent } from './lib/types';
import { loadEvents } from './data/load';
import { loadFeedIndex } from './export/feeds';
import { createStore } from './state/store';
import { applyFilters, emptyFilters, withoutDay } from './state/filters';
import { buildFacets, dayCounts, groupByDay } from './state/grouping';
import { loadSelection, persistSelection } from './state/selection';
import { detectLang, saveLang } from './i18n/lang';
import { t } from './i18n/strings';
import { downloadIcs } from './export/download';
import { delegate, prefersReducedMotion, qs, qsa } from './util/dom';
import { renderHeader } from './render/header';
import { renderFilterBar } from './render/filterbar';
import { renderDateStrip } from './render/datestrip';
import { renderAgenda } from './render/agenda';
import { renderExportBar } from './render/exportbar';
import { renderSubscribe } from './render/subscribe';

const app = document.getElementById('app')!;

const store = createStore(initialState());

function initialState(): AppState {
  return {
    status: 'loading',
    lang: detectLang(),
    generatedAt: null,
    events: [],
    byId: new Map(),
    facets: { categories: [], venues: [], arenas: [], access: [], days: [] },
    filters: emptyFilters(),
    selected: new Set(),
    expandedId: null,
    subscribeOpen: false,
    feeds: null,
    errorMessage: null,
  };
}

// ---- rendering ----------------------------------------------------------------

let shellMounted = false;
let renderedLang: Lang | null = null;
let forceFilterBar = false;
let pendingScrollDay: string | null = null;
let modalWasOpen = false;

function render(s: AppState): void {
  document.documentElement.lang = s.lang;

  if (s.status === 'loading') {
    app.setAttribute('aria-busy', 'true');
    app.innerHTML = `<div class="screen"><div class="spinner" aria-hidden="true"></div><p>${escape(t(s.lang, 'loading'))}</p></div>`;
    shellMounted = false;
    return;
  }
  if (s.status === 'error') {
    app.removeAttribute('aria-busy');
    app.innerHTML = `<div class="screen screen--error" role="alert">
        <h1>${escape(t(s.lang, 'errorTitle'))}</h1>
        <p>${escape(t(s.lang, 'errorBody'))}${s.errorMessage ? ` (${escape(s.errorMessage)})` : ''}</p>
        <button type="button" class="btn btn--primary" data-action="retry">${escape(t(s.lang, 'retry'))}</button>
      </div>`;
    shellMounted = false;
    return;
  }

  app.removeAttribute('aria-busy');
  if (!shellMounted) {
    app.innerHTML = shell();
    shellMounted = true;
    renderedLang = null;
  }

  setHtml('#app-header', renderHeader(s));
  if (renderedLang !== s.lang || forceFilterBar) {
    renderFilterBarPreservingFocus(s);
    renderedLang = s.lang;
    forceFilterBar = false;
  }

  const visible = applyFilters(s.events, s.filters);
  const groups = groupByDay(visible);
  setHtml('#datestrip', renderDateStrip(s, dayCounts(applyFilters(s.events, withoutDay(s.filters)))));
  setHtml('#agenda', renderAgenda(s, groups, visible.length));
  setHtml('#exportbar', renderExportBar(s));
  setHtml('#subscribe', renderSubscribe(s));

  // Tri-state "select all in day" checkboxes (indeterminate can't be set via HTML).
  for (const cb of qsa<HTMLInputElement>('input[data-action="select-day"]')) {
    const g = groups.find((x) => x.dayKey === cb.dataset.day);
    if (!g) continue;
    const sel = g.events.reduce((n, e) => n + (s.selected.has(e.id) ? 1 : 0), 0);
    cb.indeterminate = sel > 0 && sel < g.events.length;
  }

  // Focus the modal when it opens.
  if (s.subscribeOpen && !modalWasOpen) qs<HTMLElement>('.modal__panel')?.focus();
  modalWasOpen = s.subscribeOpen;

  if (pendingScrollDay) {
    const target = qs(`#day-${cssEscape(pendingScrollDay)}`);
    pendingScrollDay = null;
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
}

function shell(): string {
  return `
    <header id="app-header" class="header"></header>
    <section id="filterbar" class="filterbar" aria-label="Filter"></section>
    <nav id="datestrip" class="datestrip" aria-label="Days"></nav>
    <main id="agenda" class="agenda"></main>
    <footer id="exportbar" class="exportbar"></footer>
    <div id="subscribe"></div>`;
}

function setHtml(sel: string, html: string): void {
  const el = qs(sel);
  if (el) el.innerHTML = html;
}

function renderFilterBarPreservingFocus(s: AppState): void {
  const active = document.activeElement as HTMLElement | null;
  const wasSearch = !!active && active.matches('[data-filter="search"]');
  const caret = wasSearch ? (active as HTMLInputElement).selectionStart : null;
  setHtml('#filterbar', renderFilterBar(s));
  if (wasSearch) {
    const input = qs<HTMLInputElement>('[data-filter="search"]');
    if (input) {
      input.focus();
      if (caret != null) {
        try {
          input.setSelectionRange(caret, caret);
        } catch {
          /* non-text input types throw */
        }
      }
    }
  }
}

const escape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const cssEscape = (s: string): string =>
  typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');

// ---- state mutations ----------------------------------------------------------

function setFilter(patch: Partial<AppState['filters']>): void {
  store.update((s) => ({ filters: { ...s.filters, ...patch } }));
}

function toggleSelect(id: string): void {
  store.update((s) => {
    const next = new Set(s.selected);
    next.has(id) ? next.delete(id) : next.add(id);
    persistSelection(next);
    return { selected: next };
  });
}

function setDaySelection(ids: string[], on: boolean): void {
  store.update((s) => {
    const next = new Set(s.selected);
    for (const id of ids) (on ? next.add(id) : next.delete(id));
    persistSelection(next);
    return { selected: next };
  });
}

function clearSelection(): void {
  store.update(() => {
    const next = new Set<string>();
    persistSelection(next);
    return { selected: next };
  });
}

// ---- interaction wiring -------------------------------------------------------

function wire(): void {
  delegate(app, 'click', '[data-action]', (_event, el) => {
    const action = el.dataset.action!;
    switch (action) {
      case 'set-lang': {
        const lang = el.dataset.lang as Lang;
        saveLang(lang);
        store.set({ lang });
        break;
      }
      case 'set-day': {
        const day = el.dataset.day || null;
        store.update((s) => ({ filters: { ...s.filters, dayKey: day } }));
        if (day) pendingScrollDay = day;
        break;
      }
      case 'expand': {
        const id = el.dataset.id!;
        store.update((s) => ({ expandedId: s.expandedId === id ? null : id }));
        break;
      }
      case 'clear-selection':
        clearSelection();
        break;
      case 'clear-filters':
        forceFilterBar = true;
        store.set({ filters: emptyFilters() });
        break;
      case 'download': {
        const s = store.get();
        const chosen = s.events.filter((e) => s.selected.has(e.id));
        if (chosen.length) downloadIcs(chosen);
        break;
      }
      case 'open-subscribe':
        store.set({ subscribeOpen: true });
        break;
      case 'close-subscribe':
        store.set({ subscribeOpen: false });
        break;
      case 'copy':
        void copyLink(el);
        break;
      case 'retry':
        void boot();
        break;
    }
  });

  // Backdrop click (only when the overlay itself is the target).
  delegate(app, 'click', '.modal', (event, el) => {
    if (event.target === el) store.set({ subscribeOpen: false });
  });

  delegate(app, 'change', '[data-action="toggle"]', (_e, el) => {
    toggleSelect((el as HTMLInputElement).dataset.id!);
  });

  delegate(app, 'change', '[data-action="select-day"]', (_e, el) => {
    const input = el as HTMLInputElement;
    const day = input.dataset.day!;
    const s = store.get();
    const visible = applyFilters(s.events, s.filters).filter((e) => e.dayKey === day);
    setDaySelection(
      visible.map((e) => e.id),
      input.checked,
    );
  });

  delegate(app, 'change', '[data-filter]', (_e, el) => onFilterControl(el as HTMLInputElement | HTMLSelectElement));
  delegate(app, 'input', '[data-filter="search"]', (_e, el) => {
    setFilter({ search: (el as HTMLInputElement).value });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const s = store.get();
    if (s.subscribeOpen) store.set({ subscribeOpen: false });
    else if (s.expandedId) store.set({ expandedId: null });
  });
}

function onFilterControl(el: HTMLInputElement | HTMLSelectElement): void {
  const which = el.dataset.filter;
  switch (which) {
    case 'category':
      setFilter({ categoryId: (el as HTMLSelectElement).value || null });
      break;
    case 'venue':
      setFilter({ venueName: (el as HTMLSelectElement).value || null });
      break;
    case 'arena':
      setFilter({ arenaName: (el as HTMLSelectElement).value || null });
      break;
    case 'official':
      setFilter({ officialOnly: (el as HTMLInputElement).checked });
      break;
    case 'english':
      setFilter({ englishOnly: (el as HTMLInputElement).checked });
      break;
    case 'access': {
      const input = el as HTMLInputElement;
      const id = input.dataset.id!;
      store.update((s) => {
        const set = new Set(s.filters.accessIds);
        input.checked ? set.add(id) : set.delete(id);
        return { filters: { ...s.filters, accessIds: [...set] } };
      });
      break;
    }
  }
}

async function copyLink(el: HTMLElement): Promise<void> {
  const link = el.dataset.copy ?? '';
  try {
    await navigator.clipboard.writeText(link);
    const original = el.textContent;
    el.textContent = t(store.get().lang, 'copied');
    setTimeout(() => {
      el.textContent = original;
    }, 1200);
  } catch {
    /* clipboard unavailable */
  }
}

// ---- boot ---------------------------------------------------------------------

async function boot(): Promise<void> {
  store.set({ status: 'loading', errorMessage: null });
  try {
    const [envelope, feeds] = await Promise.all([loadEvents(), loadFeedIndex()]);
    const events: PrideEvent[] = envelope.events;
    const byId = new Map(events.map((e) => [e.id, e]));
    const stored = loadSelection();
    const selected = new Set([...stored].filter((id) => byId.has(id))); // drop stale ids
    store.set({
      status: 'ready',
      events,
      byId,
      facets: buildFacets(events),
      generatedAt: envelope.generatedAt,
      selected,
      feeds,
    });
  } catch (err) {
    store.set({ status: 'error', errorMessage: (err as Error).message });
  }
}

store.subscribe(render);
wire();
render(store.get());
void boot();
