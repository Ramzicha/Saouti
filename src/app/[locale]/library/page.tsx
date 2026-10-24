'use client';

import React from 'react';
import { LibraryView } from '@/components/library/LibraryView';

/**
 * Post Library Page (`/[locale]/library`)
 * Displays all saved and generated posts with combined filtering, search, and versioning.
 */
export default function LibraryPage() {
  return <LibraryView savedOnly={true} />;
}

