import type { AppState } from '../lib/types';

export interface Store {
  get(): AppState;
  set(patch: Partial<AppState>): void;
  update(fn: (s: AppState) => Partial<AppState>): void;
  subscribe(fn: (s: AppState) => void): () => void;
}

/** Tiny observable store. Notifications are batched on the microtask queue. */
export function createStore(initial: AppState): Store {
  let state = initial;
  const subs = new Set<(s: AppState) => void>();
  let scheduled = false;

  const flush = () => {
    scheduled = false;
    for (const fn of subs) fn(state);
  };
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
  };

  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      schedule();
    },
    update(fn) {
      state = { ...state, ...fn(state) };
      schedule();
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
