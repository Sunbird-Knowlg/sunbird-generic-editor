import { TRANSLATIONS_EN } from './translations.en';
import { TRANSLATIONS_AR } from './translations.ar';
import { TRANSLATIONS_HI } from './translations.hi';
import { TRANSLATIONS_TA } from './translations.ta';
import { TRANSLATIONS_FR } from './translations.fr';
import { TRANSLATIONS_PT } from './translations.pt';

const LANG_MAP: Record<string, Record<string, string>> = {
  en: TRANSLATIONS_EN,
  ar: TRANSLATIONS_AR,
  hi: TRANSLATIONS_HI,
  ta: TRANSLATIONS_TA,
  fr: TRANSLATIONS_FR,
  pt: TRANSLATIONS_PT,
};

const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

export function getDir(lang: string): 'ltr' | 'rtl' {
  return RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
}

export function getTranslations(lang: string): Record<string, string> {
  const target = LANG_MAP[lang];
  if (!target || lang === 'en') return TRANSLATIONS_EN;
  /* Merge over EN so any missing key gracefully falls back to English. */
  return { ...TRANSLATIONS_EN, ...target };
}

export function t(lang: string, key: string): string {
  const table = getTranslations(lang);
  return table[key] ?? TRANSLATIONS_EN[key] ?? key;
}

/** Interpolating variant — t with {placeholder} substitution. */
export function tf(lang: string, key: string, vars: Record<string, string | number>): string {
  let out = t(lang, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

/** Localized label for a content mimeType (used in the player preview chip). */
export function getMimeTypeLabel(lang: string, mimeType?: string): string {
  const map: Record<string, string> = {
    'application/vnd.ekstep.html-archive': t(lang, 'TYPE_HTML'),
    'application/vnd.ekstep.h5p-archive': t(lang, 'TYPE_H5P'),
    'application/vnd.ekstep.scorm-archive': t(lang, 'TYPE_SCORM'),
    'video/x-youtube': t(lang, 'TYPE_YOUTUBE'),
    'video/mp4': t(lang, 'TYPE_VIDEO'),
    'video/webm': t(lang, 'TYPE_VIDEO'),
    'application/epub': t(lang, 'TYPE_EPUB'),
    'application/pdf': t(lang, 'TYPE_PDF'),
  };
  return (mimeType && map[mimeType]) || t(lang, 'TYPE_UNKNOWN');
}

/** Localized label for a known primaryCategory; falls back to the raw value. */
export function getCategoryLabel(lang: string, category: string): string {
  const key = `CAT_${category.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  const table = getTranslations(lang);
  return table[key] ?? category;
}
