// Compact glyphs for known accessibility tags (keyed by Localized.slug). Unknown tags fall
// back to a 2-letter abbreviation of their label in the row; full labels show in the detail.
export const ACCESS_ICON: Record<string, string> = {
  'wheelchair-friendly': '♿',
  'sign-language-interpreted': '🤟',
  'alcohol-free': '🚫',
  'induction-loop': '🦻',
  english: 'EN',
};
