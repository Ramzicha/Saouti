export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';

export const THEME_COOKIE_NAME = 'saouti-theme';

/**
 * Parses the raw cookie string value and returns a validated ThemePreference.
 * Falls back to 'system' if the value is missing or unrecognized.
 */
export function parseThemeCookie(cookieValue?: string | null): ThemePreference {
  if (cookieValue === 'dark') return 'dark';
  if (cookieValue === 'light') return 'light';
  if (cookieValue === 'system') return 'system';
  return 'system';
}

/**
 * Resolves the concrete theme ('dark' | 'light') from a user preference
 * and the operating system's prefers-color-scheme status.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemIsDark: boolean,
): Theme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemIsDark ? 'dark' : 'light';
}

/**
 * Client-side helper to write theme choice to document.cookie
 */
export function setThemeCookie(preference: ThemePreference): void {
  if (typeof document === 'undefined') return;
  // Expire in 1 year, path=/
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE_NAME}=${preference}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
