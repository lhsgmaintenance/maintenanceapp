# LHSG Maintenance App - Roadmap

## Phase 1: Documentation And Safety Baseline

- Add project guidance for future Codex work.
- Document design direction.
- Create manual testing checklist.
- Start a development log.
- Establish safe rules for static HTML/CSS/JS/PWA changes.

## Phase 2: UI/UX Refinement

- Refine the mobile-first dashboard layout.
- Improve task cards, task rows, forms, buttons, badges, and admin tools.
- Add smooth micro-interactions without hurting mobile performance.
- Standardize reusable CSS variables and classes.
- Improve confirm dialogs and status feedback.

## Phase 3: Admin Bulk Task Management

- Improve admin tools for selecting multiple tasks.
- Add or refine bulk delete behavior.
- Make selected state and bulk actions clear.
- Protect destructive actions with clear confirmation.

## Phase 4: Fix Delete Flicker/Reappearing Issue

- Investigate why deleted tasks flicker or reappear.
- Trace local state, remote state, realtime listeners, and cache/service worker behavior.
- Fix the root cause without masking data sync problems.
- Verify single delete and bulk delete flows.

## Phase 5: Task Reminder Feature

- Add task reminder UI and logic.
- Support reminder scheduling and notification behavior.
- Verify permission prompts, token/subscription saving, and delivery behavior.
- Handle unavailable notification permissions gracefully.

## Phase 6: Update Notification To All Users

- Add a way to notify all users about app updates.
- Coordinate update messaging with service worker/version behavior.
- Ensure normal users and admins see clear update prompts.
- Avoid repeated or stale update notifications.

## Phase 7: Final PWA/Service Worker Testing

- Test iPhone PWA install behavior.
- Test Android PWA install behavior.
- Verify offline behavior and service worker caching.
- Verify update flow after a new deployment.
- Confirm push token/subscription persistence.
- Complete final regression testing across admin and normal user flows.
