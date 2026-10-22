# Data Models & Contracts: 002-visual-foundation

**Branch**: `002-visual-foundation` | **Date**: 2026-10-23

This document specifies UI state models, cookie storage schemas, component prop interfaces, and event contracts for the visual foundation and agent presence system.

---

## 1. Client State & Storage Models

### 1.1 Theme Mode

Specifies the active visual presentation theme.

```typescript
export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';

export interface ThemeContextValue {
  theme: Theme; // Active resolved theme ('dark' or 'light')
  preference: ThemePreference; // Stored preference ('dark', 'light', or 'system')
  setPreference: (pref: ThemePreference) => void;
}
```

- **Cookie Name**: `saouti-theme`
- **Allowed Values**: `"dark"`, `"light"`, `"system"`
- **Default Value**: `"system"`
- **Cookie Attributes**: `Path=/; SameSite=Lax; Max-Age=31536000`

### 1.2 Locale

Specifies the active language and layout direction.

```typescript
export type Locale = 'en' | 'fr' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface LocaleConfig {
  locale: Locale;
  direction: Direction;
  label: string; // Native name: "English", "Français", "العربية"
  fontClass: string;
}
```

- **Cookie Name**: `saouti-locale` (managed via `next-intl` cookie configuration)
- **Allowed Values**: `"en"`, `"fr"`, `"ar"`
- **Default Resolution**: Matches HTTP `Accept-Language` against supported locales; falls back to `"en"`.
- **Direction Mapping**:
  - `en` -> `dir="ltr"`
  - `fr` -> `dir="ltr"`
  - `ar` -> `dir="rtl"`

---

## 2. Agent Presence & Activity Timeline Models

### 2.1 Agent Definition

Enumeration of the 5 visible AI agents in the Saouti pipeline with assigned semantic color tokens.

```typescript
export type AgentId = 'writer' | 'critic' | 'art' | 'profiler' | 'strategist';

export interface AgentInfo {
  id: AgentId;
  name: string; // "Writer", "Critic", "Art Director", "Profiler", "Strategist"
  colorToken: string; // "var(--agent-writer)", "var(--agent-critic)", etc.
}
```

### 2.2 Agent Timeline Step

Represents a single step in the agent execution timeline.

```typescript
export type AgentStepState =
  'done' | 'working' | 'waiting' | 'paused' | 'failed';

export interface AgentStep {
  id: string; // Unique step identifier (e.g., "step-1")
  agent: AgentId; // Which agent is responsible
  action: string; // Lowercase action description (e.g., "drafting the LinkedIn version")
  state: AgentStepState; // Current execution state
  durationSeconds?: number; // If state is 'done', elapsed duration in seconds (e.g., 4.2)
  pauseCountdownSeconds?: number; // If state is 'paused', countdown until retry (e.g., 20)
  failureReason?: string; // If state is 'failed', human-readable error explanation
  sourceAgent?: AgentId; // For revisions: e.g. Critic to Writer
}
```

### 2.3 Agent Status Event

Contract for events consumed by the active-agent chip and timeline.

```typescript
export interface AgentStatusEvent {
  timestamp: string; // ISO 8601 string
  activeAgent: AgentId;
  step: AgentStep;
  totalSteps: number;
  completedSteps: number;
}
```

---

## 3. Component Prop Contracts

### 3.1 Button Component

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string; // Required when variant === 'icon'
  children?: React.ReactNode;
}
```

### 3.2 Chip Component

```typescript
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  variant?: 'interactive' | 'status';
  dotColor?: string; // CSS variable or dot indicator color
  children: React.ReactNode;
}
```

### 3.3 Card Component

```typescript
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  children: React.ReactNode;
}
```

### 3.4 PostCard Component (Gallery preview)

```typescript
export interface PostCardProps {
  platform: 'LinkedIn' | 'Twitter/X' | 'Threads' | 'Instagram';
  status: 'ready' | 'in_review';
  content: string;
  imagePrompt?: string;
  onCopy?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
}
```

### 3.5 Composer Component

```typescript
export interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  isWorking?: boolean;
  activeAgent?: AgentId;
}
```
