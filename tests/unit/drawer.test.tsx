import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// Mock next-intl and routing navigation
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import { Sidebar } from '@/components/layout/Sidebar';

describe('Sidebar and Drawer Focus/Responsive Behavior', () => {
  it('renders mobile drawer when isMobileOpen is true and fires onCloseMobile on close click or Escape', () => {
    let closed = false;
    const { unmount } = render(
      <Sidebar isMobileOpen={true} onCloseMobile={() => (closed = true)} />,
    );

    const dialog = screen.getByRole('dialog', { name: /navigation drawer/i });
    expect(dialog).toBeInTheDocument();

    const closeBtn = within(dialog).getByRole('button', {
      name: /close navigation menu/i,
    });
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);

    // Test Escape key listener
    closed = false;
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);

    unmount();
  });
});
