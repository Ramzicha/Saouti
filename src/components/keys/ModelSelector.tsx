'use client';

import React, { useState } from 'react';
import { IconCpu } from '@tabler/icons-react';

interface ModelOption {
  id: string;
  displayName: string;
  description: string;
}

const SUPPORTED_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash (Recommended)',
    description: 'Fast, state-of-the-art model with universal support.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite',
    description: 'Lightweight model optimized for low-latency tasks.',
  },
];

export function ModelSelector() {
  const [writerModel, setWriterModel] = useState('gemini-3.5-flash');
  const [criticModel, setCriticModel] = useState('gemini-3.5-flash');

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <IconCpu className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold text-foreground">
          Per-Task Model Configuration
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="writer-model-select"
            className="text-xs font-semibold text-foreground block"
          >
            Writer Agent Model
          </label>
          <select
            id="writer-model-select"
            value={writerModel}
            onChange={(e) => setWriterModel(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SUPPORTED_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Powers draft generation and voice profile synthesis.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="critic-model-select"
            className="text-xs font-semibold text-foreground block"
          >
            Critic Agent Model
          </label>
          <select
            id="critic-model-select"
            value={criticModel}
            onChange={(e) => setCriticModel(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SUPPORTED_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Powers structured critique, hook scoring, and feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
