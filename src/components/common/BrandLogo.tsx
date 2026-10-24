import React from 'react';
import Image from 'next/image';

export interface BrandLogoProps {
  variant?: 'full' | 'icon';
  height?: number;
  width?: number;
  className?: string;
  priority?: boolean;
}

/**
 * BrandLogo component that automatically switches between dark and light logos
 * based on the active design system theme (`[data-theme='dark']` vs `[data-theme='light']`).
 */
export function BrandLogo({
  variant = 'full',
  height = 32,
  width,
  className = '',
  priority = true,
}: BrandLogoProps) {
  if (variant === 'icon') {
    const iconSize = height || width || 28;
    return (
      <Image
        src="/favicon.png"
        alt="Saouti Logo Icon"
        width={iconSize}
        height={iconSize}
        priority={priority}
        className={`inline-block shrink-0 object-contain ${className}`}
        style={{ height: `${iconSize}px`, width: `${iconSize}px` }}
      />
    );
  }

  // Logo aspect ratio is 500 x 208 (approx 2.4 : 1)
  const calculatedWidth = width || Math.round(height * (500 / 208));

  return (
    <span className={`relative inline-flex items-center shrink-0 ${className}`}>
      {/* Dark theme logo (shown when html[data-theme='dark']) */}
      <Image
        src="/logo-dark.png"
        alt="Saouti"
        width={calculatedWidth}
        height={height}
        priority={priority}
        className="hidden dark:block shrink-0 object-contain"
        style={{ height: `${height}px`, width: 'auto' }}
      />
      {/* Light theme logo (shown when html:not([data-theme='dark'])) */}
      <Image
        src="/logo-light.png"
        alt="Saouti"
        width={calculatedWidth}
        height={height}
        priority={priority}
        className="block dark:hidden shrink-0 object-contain"
        style={{ height: `${height}px`, width: 'auto' }}
      />
    </span>
  );
}
