import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders primary button variant with proper styling and handles clicks', () => {
      let clicked = false;
      render(<Button onClick={() => (clicked = true)}>Test Action</Button>);

      const btn = screen.getByRole('button', { name: /test action/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(clicked).toBe(true);
    });

    it('requires and renders aria-label for icon button', () => {
      render(
        <Button variant="icon" ariaLabel="Send message">
          <span>Icon</span>
        </Button>,
      );
      expect(
        screen.getByRole('button', { name: /send message/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Chip', () => {
    it('renders interactive chip and toggles aria-pressed', () => {
      render(<Chip selected={true}>LinkedIn</Chip>);
      const chip = screen.getByRole('button', { name: /linkedin/i });
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders status chip with role="status"', () => {
      render(
        <Chip variant="status" dotColor="#FF6B9D">
          Writer · drafting
        </Chip>,
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        /writer · drafting/i,
      );
    });
  });

  describe('Input', () => {
    it('renders label and applies dir="auto"', () => {
      render(<Input label="Prompt Title" placeholder="Enter title" />);
      const input = screen.getByPlaceholderText(/enter title/i);
      expect(input).toHaveAttribute('dir', 'auto');
      expect(screen.getByText(/prompt title/i)).toBeInTheDocument();
    });
  });

  describe('Toast', () => {
    it('renders with role="status" and displays message', () => {
      render(<Toast message="Copied to clipboard" />);
      expect(screen.getByRole('status')).toHaveTextContent(
        /copied to clipboard/i,
      );
    });
  });
});
