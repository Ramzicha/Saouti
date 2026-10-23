import { describe, it, expect } from 'vitest';
import { normalizeArabicText } from '@/lib/search/arabic-normalizer';

describe('normalizeArabicText', () => {
  it('normalizes Alef variants (أ, إ, آ) to bare Alef (ا)', () => {
    expect(normalizeArabicText('أزمة')).toBe('ازمه');
    expect(normalizeArabicText('إدارة')).toBe('اداره');
    expect(normalizeArabicText('آفاق')).toBe('افاق');
    expect(normalizeArabicText('الاستثمار الأجنبي')).toBe('الاستثمار الاجنبي');
  });

  it('normalizes Taa Marbuta (ة) to Haa (ه)', () => {
    expect(normalizeArabicText('شركة')).toBe('شركه');
    expect(normalizeArabicText('تقنية')).toBe('تقنيه');
  });

  it('normalizes Alef Maqsura (ى) to Yaa (ي)', () => {
    expect(normalizeArabicText('على')).toBe('علي');
    expect(normalizeArabicText('مستوى')).toBe('مستوي');
  });

  it('strips Tashkeel / Harakat and Tanween', () => {
    // كَتَبَ -> كتب
    expect(normalizeArabicText('كَتَبَ')).toBe('كتب');
    // ذَكاءٌ اصْطِناعِيٌّ -> ذكاء اصطناعي
    expect(normalizeArabicText('ذَكاءٌ اصْطِناعِيٌّ')).toBe('ذكاء اصطناعي');
  });

  it('strips Tatweel (Kashida ـ)', () => {
    expect(normalizeArabicText('صـــوت')).toBe('صوت');
  });

  it('handles mixed English, French and Arabic gracefully', () => {
    const input = 'AI و الذَّكاءُ الاصْطِناعِيّ في الجزائر 2026';
    expect(normalizeArabicText(input)).toBe('AI و الذكاء الاصطناعي في الجزائر 2026');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeArabicText('')).toBe('');
    expect(normalizeArabicText('   ')).toBe('');
  });
});
