# Accessibility (A11y) Compliance Report

FinResilience Pro is designed to meet WCAG 2.1 AA standards to ensure equitable access to financial orchestration.

## Automated Verification
- **Framework**: `jest-axe` integrated with Vitest.
- **Coverage**: All interactive form elements, panels, and routing boundaries are verified against axe-core rules.

## Implemented A11y Features

### 1. Visual Presentation
- **Reduced Motion**: Full support for `prefers-reduced-motion` CSS media queries. The ambient gradient animations and spring transitions automatically degrade to static renders for users sensitive to motion.
- **Color Contrast**: The dark fintech palette (e.g., `#1E40AF` primary on `#0F172A` background) passes WCAG AA contrast ratios (4.5:1 for normal text).
- **Focus Indicators**: Distinct, highly visible focus rings (`:focus-visible` with 3px solid `#1E40AF` and 2px offset) across all interactive elements.

### 2. Semantic HTML & ARIA
- **Form Controls**: Every input in `InputForm.tsx` is explicitly linked to a `<label>` element.
- **Error Handling**: Form validation errors utilize `aria-describedby`, `aria-live="assertive"`, and `role="alert"` (e.g., in `LoginForm.tsx`) to immediately notify screen readers of validation failures.
- **Dynamic Content**: Data loading states utilize `aria-busy="true"` on submission buttons.
- **Hidden Text**: SRO (Screen Reader Only) text (`.visually-hidden`) is provided as an alternative for visual elements (e.g., tabular breakdown for the Recharts `HistoryChart`).

### 3. Keyboard Navigation
- Logical tab order maintained.
- Skip link ("Skip to main content") provided for immediate content access.
