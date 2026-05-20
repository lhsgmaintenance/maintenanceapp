# LHSG Maintenance App - Design Direction

The LHSG Maintenance App should feel like a modern, clean, mobile-first maintenance dashboard: practical, fast, professional, and friendly.

## UI Personality

- Professional enough for operations and admin work.
- Friendly enough for daily use by normal users.
- Clear, calm, and easy to scan on small screens.
- Dashboard-like, with strong task readability and quick actions.
- Polished without feeling heavy or decorative.

## Visual Style

- Use a mobile-first layout.
- Prefer clean spacing, readable typography, and strong hierarchy.
- Use cards and panels for task groups, admin tools, and important status blocks.
- Use clearer task rows with obvious titles, metadata, status, and actions.
- Improve buttons so primary, secondary, danger, and disabled states are visually distinct.
- Make confirm dialogs clear, deliberate, and hard to mis-tap.
- Use colors consistently through CSS variables.

## Interaction Style

- Add smooth micro-interactions for taps, button states, row expansion, dialogs, and status changes.
- Keep animations subtle and fast.
- Avoid heavy animations that hurt mobile performance.
- Respect PWA/mobile constraints: quick load, low jank, and touch-friendly controls.
- Avoid interaction patterns that rely only on hover.

## CSS Approach

- Use CSS variables for color, spacing, shadows, radii, and motion values.
- Prefer reusable classes for buttons, cards, badges, rows, dialogs, toolbars, and admin controls.
- Keep styling compatible with the existing static HTML/CSS/JS structure.
- Avoid introducing a build step unless explicitly approved.

## Inspiration

The interface may take inspiration from modern animation and component styles seen in GSAP, anime.js, and react-bits examples, but the app must remain a static HTML/CSS/JavaScript PWA unless conversion is explicitly approved.

## Priority Areas

- Main dashboard and task list readability.
- Task creation and edit forms.
- Routine task flow.
- Admin bulk task management.
- Delete and double-confirm flows.
- Reminder and update notification UI.
- PWA install and update states.
