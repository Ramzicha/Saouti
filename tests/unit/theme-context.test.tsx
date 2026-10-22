import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/common/ThemeProvider';
import { ThemeToggle } from '@/components/common/ThemeToggle';

function TestConsumer() {
  const { theme, preference } = useTheme();
  return (
    <div>
      <span data-testid="resolved-theme">{theme}</span>
      <span data-testid="active-preference">{preference}</span>
      <ThemeToggle />
    </div>
  );
}

describe('ThemeProvider and ThemeToggle', () => {
  it('renders with initial system preference and allows switching to light and dark', () => {
    render(
      <ThemeProvider initialPreference="system">
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('active-preference')).toHaveTextContent('system');

    // Click light button
    const lightBtn = screen.getByRole('button', { name: /light theme/i });
    fireEvent.click(lightBtn);

    expect(screen.getByTestId('active-preference')).toHaveTextContent('light');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');

    // Click dark button
    const darkBtn = screen.getByRole('button', { name: /dark theme/i });
    fireEvent.click(darkBtn);

    expect(screen.getByTestId('active-preference')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
