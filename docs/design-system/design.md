# Saouti Design System

Version 0.2 · 22 October 2026

This file is the source of truth for Saouti's interface. Any UI work (human or AI agent) must follow it. The visual reference is the **Saouti Design System** canvas (tokens board, dark workspace, light workspace). Where this file and the canvas differ, fix the canvas or this file in the same change.

Items marked **(proposed)** are not yet drawn on the canvas.

---

## 1. Principles

1. **Quiet and neutral.** Near-black and near-white surfaces, thin borders, no gradients, no shadows for decoration.
2. **One accent.** A single pink per theme, used for highlights only (logo, selected state, active agent outline, focus ring).
3. **Neutral primary buttons.** White in dark mode, black in light mode. The accent is never a button fill.
4. **One serif word.** Each headline may contain a single word in Instrument Serif Italic as its accent. Never more.
5. **Agents are visible.** The interface always shows which agent is working and what it is doing.
6. **Both themes, three languages.** Every screen works in light and dark, in English, French and Arabic (right to left).
7. **Accessible by default.** WCAG AA contrast, full keyboard use, no meaning carried by colour alone.

---

## 2. Colour tokens

Tokens are CSS variables. Use the semantic name in code. The canvas short name is given for cross-reference.

| Semantic token            | Canvas name | Dark      | Light     | Use                                                    |
| ------------------------- | ----------- | --------- | --------- | ------------------------------------------------------ |
| `--bg`                    | bg          | `#0B0B0C` | `#FAFAF8` | Page background                                        |
| `--surface`               | s1          | `#131314` | `#FFFFFF` | Sidebar, cards, composer, timeline rows                |
| `--surface-raised`        | s2          | `#1B1B1D` | `#F2F1ED` | Hover, active nav item, user bubble, secondary buttons |
| `--border`                | bd          | `#2A2A2D` | `#E3E1DB` | All 1 px borders and dividers                          |
| `--text`                  | tx          | `#F3F3F1` | `#141415` | Primary text                                           |
| `--muted`                 | mu          | `#A0A0A6` | `#5C5C62` | Secondary text, labels, placeholders                   |
| `--accent`                | ac          | `#FF6B9D` | `#C21858` | Highlights, selected chips, focus ring, logo mark      |
| `--accent-soft`           | acs         | `#3A1626` | `#FCE4EE` | Selected chip background, avatar background            |
| `--on-accent`             | onac        | `#1A0A10` | `#FFFFFF` | Text on a solid accent fill (rare)                     |
| `--button`                | bt          | `#F3F3F1` | `#141415` | Primary button fill                                    |
| `--on-button`             | onbt        | `#0B0B0C` | `#FAFAF8` | Primary button text                                    |
| `--success`               | ok          | `#4ADE80` | `#15803D` | Ready tag, success text                                |
| `--danger` **(proposed)** | n/a         | `#FF7A7A` | `#B42318` | Failed agent state, destructive actions, error text    |

### Agent colours

Always shown next to the agent's name, never alone.

| Agent        | Token                | Canvas name | Dark      | Light     |
| ------------ | -------------------- | ----------- | --------- | --------- |
| Writer       | `--agent-writer`     | c1          | `#FF6B9D` | `#C21858` |
| Critic       | `--agent-critic`     | c2          | `#F5B73D` | `#92580A` |
| Art Director | `--agent-art`        | c3          | `#6DB2FF` | `#1D4ED8` |
| Profiler     | `--agent-profiler`   | c4          | `#4ADE80` | `#15803D` |
| Strategist   | `--agent-strategist` | c5          | `#B69CFF` | `#6D28D9` |

### Reference stylesheet

```css
:root[data-theme='dark'] {
  --bg: #0b0b0c;
  --surface: #131314;
  --surface-raised: #1b1b1d;
  --border: #2a2a2d;
  --text: #f3f3f1;
  --muted: #a0a0a6;
  --accent: #ff6b9d;
  --accent-soft: #3a1626;
  --on-accent: #1a0a10;
  --button: #f3f3f1;
  --on-button: #0b0b0c;
  --success: #4ade80;
  --danger: #ff7a7a;
  --agent-writer: #ff6b9d;
  --agent-critic: #f5b73d;
  --agent-art: #6db2ff;
  --agent-profiler: #4ade80;
  --agent-strategist: #b69cff;
}

:root[data-theme='light'] {
  --bg: #fafaf8;
  --surface: #ffffff;
  --surface-raised: #f2f1ed;
  --border: #e3e1db;
  --text: #141415;
  --muted: #5c5c62;
  --accent: #c21858;
  --accent-soft: #fce4ee;
  --on-accent: #ffffff;
  --button: #141415;
  --on-button: #fafaf8;
  --success: #15803d;
  --danger: #b42318;
  --agent-writer: #c21858;
  --agent-critic: #92580a;
  --agent-art: #1d4ed8;
  --agent-profiler: #15803d;
  --agent-strategist: #6d28d9;
}
```

---

## 3. Typography

| Role        | Font                     | Weights       | Notes                                                                                |
| ----------- | ------------------------ | ------------- | ------------------------------------------------------------------------------------ |
| Interface   | Inter                    | 400, 500, 600 | Fallback: system-ui, sans-serif                                                      |
| Accent word | Instrument Serif, italic | 400           | Fallback: Georgia, serif. One word per headline, set at 1.14 em of the headline size |
| Arabic      | Noto Sans Arabic         | 400, 600      | Used for all Arabic text in the interface and in generated posts                     |

Font stack for the app: `Inter, 'Noto Sans Arabic', system-ui, sans-serif`.

| Style                   | Size / line height | Weight | Other                                  |
| ----------------------- | ------------------ | ------ | -------------------------------------- |
| Display (page headline) | 34 / 40 px         | 500    | Letter spacing -0.01 em                |
| Heading                 | 20 / 28 px         | 600    |                                        |
| Body                    | 14 / 21 px         | 400    |                                        |
| Small                   | 13 px              | 400    | Chips, buttons, secondary rows         |
| Caption                 | 12 / 16 px         | 400    | Tags, times, image prompts (12.5 px)   |
| Label                   | 11 px              | 500    | Uppercase, 0.06 em tracking, `--muted` |

**Arabic rule (proposed):** Instrument Serif has no Arabic italic. In Arabic, emphasise the accent word with weight 600 only, not italic.

---

## 4. Layout, spacing and shape

**Spacing scale:** 4, 8, 12, 16, 24, 32 px. Do not invent other values.

**Radius**

| Element                         | Radius        |
| ------------------------------- | ------------- |
| Buttons, inputs, nav items      | 8 px          |
| List and timeline rows          | 12 px         |
| Cards                           | 16 px         |
| Composer                        | 18 px         |
| Chips, tags, round icon buttons | Fully rounded |

**App shell**

- Sidebar 240 px wide, `--surface` background, 1 px right border.
- Header 56 px high, 1 px bottom border, page title at the start and the active agent chip at the end.
- Content column: maximum 876 px wide, centred, 28 px side padding.
- Composer: maximum 820 px wide, pinned at the bottom, with a one-line disclaimer under it.
- Post cards: two columns on desktop.

**Breakpoint:** below 760 px the sidebar becomes a drawer opened by a button, post cards become one column and side padding becomes 16 px.

**Borders:** always 1 px `--border`. Selected or active elements use `--accent` as the border colour.

---

## 5. Components

### Buttons

| Variant     | Fill                       | Text                      | Border     |
| ----------- | -------------------------- | ------------------------- | ---------- |
| Primary     | `--button`                 | `--on-button`, weight 600 | `--button` |
| Secondary   | `--surface-raised`         | `--text`                  | `--border` |
| Icon (send) | Primary fill, 44 px circle | `--on-button`             | none       |

All buttons: 13 px text, minimum height 44 px, horizontal padding 14 px, radius 8 px (icon buttons are circles), real `<button>` elements. Icon-only buttons need an `aria-label`.

### Chips

- Pill with 1 px `--border`, `--surface` background, 13 px text, 8 px gap between dot or icon and label.
- Interactive chips are `<button>` elements, minimum height 36 px.
- **Selected:** `--accent-soft` background, `--accent` border and text.
- **Status chip** (header): not interactive, `role="status"`, shows an agent dot and one line of text.

### Tags

12 px text in a thin pill with 1 px `--border`. **Ready** uses `--success`. **In review** uses `--agent-critic`.

### Cards

`--surface` background, 1 px `--border`, radius 16, padding 18, 12 px gap between parts.

### Inputs

Composer input is transparent with no border, `--text` colour, `--muted` placeholder. Every input has a visible label or an `aria-label`.

### Navigation

Sidebar items: 9 px by 10 px padding, radius 8, `--muted` text. Hover and the active item use `--surface-raised` background with `--text`. Section labels use the Label style. Recent runs are single-line, truncated with an ellipsis.

### Post card

1. Header: platform name (weight 500) and status tag.
2. Body: post text, preserving line breaks.
3. Image prompt: 12.5 px `--muted`, separated by a top border.
4. Actions: **Copy** (primary), **Edit**, **Regenerate** (secondary).

Placeholders such as `[YOUR NUMBER]` are highlighted **(proposed)** with `--accent-soft` background and `--accent` text.

### Composer

Rounded container (radius 18) with the text input on top. Below it, one row of: active-agent chip, platform chips, model chip, and the round send button pushed to the end. Disclaimer text below: "Saouti drafts with AI. Review every post before you publish."

### Toast **(proposed)**

`--surface-raised` background, 1 px `--border`, radius 12, 14 px text, bottom centre, disappears after 4 seconds, announced with `role="status"`.

---

## 6. Agent presence

### Active-agent chip

A status chip showing the agent's coloured dot, its name and a one-line status, separated by a middle dot. Example: **Critic · checking voice and platform rules**.

### Activity timeline

An ordered list of rows, one per agent step. Each row has: coloured dot, agent name (weight 500, minimum 104 px wide), status text in `--muted`, and time or state at the end.

| State                 | Dot                                | Row               | Time text                                      |
| --------------------- | ---------------------------------- | ----------------- | ---------------------------------------------- |
| Done                  | Solid agent colour                 | Default border    | Duration, e.g. 4.2 s                           |
| Working               | Solid, pulsing                     | `--accent` border | Working                                        |
| Waiting               | Hollow (2 px ring in agent colour) | Default border    | Next                                           |
| Paused **(proposed)** | Solid, no pulse                    | Default border    | Retry countdown, e.g. Paused, retrying in 20 s |
| Failed **(proposed)** | Solid `--danger`                   | `--danger` border | Failed, with a plain-language reason           |

Status copy format: **Agent · action in lower case**, for example "Writer · drafting the LinkedIn version". Revisions read "Critic to Writer · hook is generic, requesting a revision".

---

## 7. Motion

- The only continuous animation is the working-agent dot: pulse over 1.2 s, ease-in-out, scale 1 to 1.35 and opacity 1 to 0.45, repeating.
- Hover and focus transitions: 120 to 150 ms.
- Everything animated stops under `prefers-reduced-motion: reduce`.

---

## 8. Accessibility

- Text contrast meets WCAG AA in both themes (4.5:1 for body text, 3:1 for text of 24 px and larger). Check every new colour pair with an automated tool before adding it.
- Focus: `:focus-visible` shows a 2 px `--accent` outline with 2 px offset on every interactive element. Never remove it.
- Use real `<button>`, `<a href>`, `<input>` with `<label>`. Never attach click handlers to a `div` or `span`.
- Icons that carry meaning have an accessible name; decorative icons use `aria-hidden="true"`.
- Colour is never the only signal. Agents always appear with their name; states also use text.
- Live status text (agent chip, toasts) uses `role="status"`.
- Interactive targets: buttons at least 44 px high; dense chips at least 36 px.

---

## 9. Right to left and localisation

- Languages: English, French, Arabic. Arabic mirrors the whole layout (sidebar on the right, timeline text aligned to the start).
- Write CSS with logical properties: `margin-inline`, `padding-inline`, `inset-inline`, `border-inline-start`, `text-align: start`.
- Set `dir` and `lang` on the root; set `dir="auto"` on user-generated and AI-generated text so mixed content renders correctly.
- Mirror only directional icons (arrows, chevrons). Do not mirror logos, numbers, code or media controls.
- Never concatenate translated fragments into sentences; use full message strings with placeholders.
- Missing translations fall back to English.

---

## 10. Theming implementation

- Default to the system theme with `prefers-color-scheme`; the user can override with a toggle. Store the choice in a cookie so the server renders the right theme on the first paint with no flash.
- Set the theme on `<html data-theme="dark|light">`.
- Map tokens into Tailwind so classes use the variables:

```js
// tailwind.config.js (excerpt)
theme: {
  extend: {
    colors: {
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      raised: 'var(--surface-raised)',
      border: 'var(--border)',
      text: 'var(--text)',
      muted: 'var(--muted)',
      accent: 'var(--accent)',
      'accent-soft': 'var(--accent-soft)',
      button: 'var(--button)',
      'on-button': 'var(--on-button)',
      success: 'var(--success)',
      danger: 'var(--danger)',
    },
    borderRadius: { control: '8px', row: '12px', card: '16px', composer: '18px' },
  },
}
```

- No raw hex values in components. A new colour needs a new token in both themes first.

---

## 11. Writing the interface

- Plain, short, direct. Sentence case for buttons and headings.
- Agent names are capitalised: Writer, Critic, Art Director, Profiler, Strategist.
- Errors say what happened and what to do next. Never blame the user.
- No emoji in the interface.

---

## 12. Do and don't

| Do                                      | Don't                                         |
| --------------------------------------- | --------------------------------------------- |
| Use neutral primary buttons             | Fill buttons with the accent                  |
| Use the accent for highlights and focus | Use more than one accent colour               |
| Put one serif italic word in a headline | Use serif italics elsewhere or more than once |
| Show agent colour with the agent name   | Rely on colour alone                          |
| Use tokens and the spacing scale        | Add raw hex values or odd spacing             |
| Keep surfaces flat with 1 px borders    | Add gradients, glows or decorative shadows    |
| Test both themes and Arabic             | Ship a screen checked in one theme only       |

---

## 13. Implementer checklist

- [ ] Uses tokens only, no raw colours.
- [ ] Looks right in light, dark and with Arabic right to left.
- [ ] Keyboard reachable, visible focus, labelled controls.
- [ ] Contrast checked for any new colour pair.
- [ ] Motion respects reduced-motion settings.
- [ ] Component added to the `/design` gallery page in both themes.
