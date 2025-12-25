# Accessibility guide (WCAG 2.2 AA)

Goal: Make the UI usable for everyone and meet WCAG 2.2 AA. This covers keyboard access, screen readers, and clear visuals.

## Standards and principles
- Semantic HTML first (use proper headings, lists, buttons, labels, form inputs).
- Visible focus styles on every interactive element (keyboard users see where they are).
- Text alternatives: descriptive `alt` text for images and clear labels for inputs and toggles.
- Colour contrast: meet AA contrast ratios; avoid conveying meaning by colour alone.
- Keyboard support: all actions reachable via keyboard; no keyboard traps.
- Error and validation messages: short, clear, and tied to fields via `aria-describedby` where needed.
- Live regions: announce status changes (e.g., schedule success/failure) with `aria-live` when dynamic content arrives.

## Current state (static preview)
- The static HTML uses semantic structure, labelled inputs, and visible focus outlines.
- Mobile-friendly layout for small screens; prefers reduced motion with minimal animations.

## How to check accessibility
- Quick automated scan (no install needed up front):
  - Windows: `cd buffer-replacement && npx pa11y web/index.html`
  - macOS/Linux: `cd buffer-replacement && npx pa11y web/index.html`
  - This installs `pa11y` on the fly and scans the static page. Expect minor warnings until the full app is wired.
- Manual checks (recommended):
  - Navigate the page with only the keyboard (Tab/Shift+Tab/Enter/Space) to ensure every control is reachable and focus is visible.
  - Use a screen reader (NVDA on Windows, VoiceOver on macOS) to confirm labels announce clearly and form instructions make sense.
  - Test colour contrast with any online checker if you change colours.

## When wiring the app
- Keep ARIA usage minimal and meaningful; prefer native elements.
- Ensure drag-and-drop has keyboard equivalents and instructions.
- Document any known gaps and add follow-up tasks to PLAN.md if a11y issues appear.
