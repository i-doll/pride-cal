import type { FeedIndex } from '../lib/types';

/** Load the manifest of pre-generated subscribe feeds (best-effort). */
export async function loadFeedIndex(): Promise<FeedIndex | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}feeds/index.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    return (await res.json()) as FeedIndex;
  } catch {
    return null;
  }
}

/** Absolute https + webcal URLs for a feed file, derived from the deployed origin + base. */
export function feedUrls(file: string): { https: string; webcal: string } {
  const https = `${location.origin}${import.meta.env.BASE_URL}feeds/${file}`;
  return { https, webcal: https.replace(/^https?:\/\//, 'webcal://') };
}

/** Google Calendar "add by URL" subscribe link (requires the https URL, not webcal). */
export function googleSubscribeUrl(httpsUrl: string): string {
  return `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(httpsUrl)}`;
}
