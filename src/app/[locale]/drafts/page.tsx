'use client';

import React from 'react';
import { LibraryView } from '@/components/library/LibraryView';

/**
 * Drafts Page (`/[locale]/drafts`)
 * Displays posts specifically filtered by status: 'draft'.
 */
export default function DraftsPage() {
  return (
    <LibraryView
      initialStatus="draft"
      title="Drafts"
      subtitle="Review, edit, and refine your in-progress drafts before publishing."
    />
  );
}
