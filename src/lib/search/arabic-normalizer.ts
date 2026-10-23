/**
 * Arabic Orthographic Normalizer
 * Standardizes Arabic text for robust full-text search matching across
 * spelling variants (Alef forms, Taa Marbuta, Alef Maqsura) and diacritics.
 */

// Tashkeel unicode range: \u064B - \u0652 (Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun)
const TASHKEEL_REGEX = /[\u064B-\u0652]/g;
// Tatweel / Kashida (\u0640)
const TATWEEL_REGEX = /\u0640/g;
// Alef variants: أ, إ, آ -> ا
const ALEF_REGEX = /[أإآ]/g;
// Taa Marbuta: ة -> ه
const TAA_MARBUTA_REGEX = /ة/g;
// Alef Maqsura: ى -> ي
const ALEF_MAQSURA_REGEX = /ى/g;

export function normalizeArabicText(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  return trimmed
    .replace(ALEF_REGEX, 'ا')
    .replace(TAA_MARBUTA_REGEX, 'ه')
    .replace(ALEF_MAQSURA_REGEX, 'ي')
    .replace(TASHKEEL_REGEX, '')
    .replace(TATWEEL_REGEX, '')
    .replace(/\s+/g, ' ');
}
