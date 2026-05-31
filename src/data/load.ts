import type { EventsEnvelope } from '../lib/types';

/**
 * Load the static, build-generated dataset. Served from the same origin under the Pages
 * base path, so this is the committed last-good snapshot — no third-party runtime call.
 */
export async function loadEvents(): Promise<EventsEnvelope> {
  const res = await fetch(`${import.meta.env.BASE_URL}events.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`events.json HTTP ${res.status}`);
  return (await res.json()) as EventsEnvelope;
}
