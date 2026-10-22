import { Inter, Instrument_Serif, Noto_Sans_Arabic } from 'next/font/google';

/**
 * Interface Font: Inter
 * Weights: 400 (regular), 500 (medium), 600 (semibold)
 * Used as primary sans font across all UI components.
 */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Headline Accent Word Font: Instrument Serif Italic
 * Weight: 400 italic
 * Used strictly for a single word per headline per Design System §1.
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-serif',
  display: 'swap',
});

/**
 * Arabic Typography: Noto Sans Arabic
 * Weights: 400 (regular), 600 (semibold)
 * Used for all Arabic text. Emphasised accent words in Arabic use weight 600 (not italic).
 */
export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  variable: '--font-arabic',
  display: 'swap',
});
