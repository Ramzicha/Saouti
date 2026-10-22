import { describe, it, expect } from 'vitest';
import {
  parseThemeCookie,
  resolveTheme,
  THEME_COOKIE_NAME,
  type ThemePreference,
} from '@/lib/theme';

describe('theme library', () => {
  it('has the correct cookie name constant', () => {
    expect(THEME_COOKIE_NAME).toBe('saouti-theme');
  });

  describe('parseThemeCookie', () => {
    it('returns "dark" when cookie is "dark"', () => {
      expect(parseThemeCookie('dark')).toBe('dark');
    });

    it('returns "light" when cookie is "light"', () => {
      expect(parseThemeCookie('light')).toBe('light');
    });

    it('returns "system" when cookie is "system"', () => {
      expect(parseThemeCookie('system')).toBe('system');
    });

    it('defaults to "system" when cookie is null or undefined', () => {
      expect(parseThemeCookie(null)).toBe('system');
      expect(parseThemeCookie(undefined)).toBe('system');
    });

    it('defaults to "system" for unknown or corrupt cookie values', () => {
      expect(parseThemeCookie('sepia')).toBe('system');
      expect(parseThemeCookie('')).toBe('system');
    });
  });

  describe('resolveTheme', () => {
    it('resolves explicit "dark" to "dark" regardless of system setting', () => {
      expect(resolveTheme('dark', false)).toBe('dark');
      expect(resolveTheme('dark', true)).toBe('dark');
    });

    it('resolves explicit "light" to "light" regardless of system setting', () => {
      expect(resolveTheme('light', false)).toBe('light');
      expect(resolveTheme('light', true)).toBe('light');
    });

    it('resolves "system" to "dark" when system is dark', () => {
      expect(resolveTheme('system', true)).toBe('dark');
    });

    it('resolves "system" to "light" when system is not dark', () => {
      expect(resolveTheme('system', false)).toBe('light');
    });
  });
});
