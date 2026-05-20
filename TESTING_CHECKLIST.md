# LHSG Maintenance App - Manual Testing Checklist

Use this checklist after changes, especially before committing and pushing.

## PWA Install

- [ ] iPhone: open the app in Safari.
- [ ] iPhone: add the app to the Home Screen.
- [ ] iPhone: launch from the Home Screen icon.
- [ ] iPhone: confirm layout fits the standalone PWA view.
- [ ] Android: open the app in Chrome.
- [ ] Android: install/add the app to the Home Screen.
- [ ] Android: launch from the installed app icon.
- [ ] Android: confirm layout fits the standalone PWA view.

## Login

- [ ] Admin login works.
- [ ] Admin-only tools are visible after admin login.
- [ ] Normal user login works.
- [ ] Admin-only tools are hidden from normal users.
- [ ] Logout works.

## Task Flows

- [ ] Create a work task.
- [ ] Created work task appears in the expected list.
- [ ] Create a routine task.
- [ ] Created routine task appears in the expected list.
- [ ] Edit a task.
- [ ] Edited task saves and refreshes correctly.
- [ ] Delete a task.
- [ ] Deleted task disappears and does not reappear.
- [ ] Bulk delete tasks.
- [ ] Bulk-deleted tasks disappear and do not reappear.
- [ ] Double confirm dialog appears for destructive actions.
- [ ] Cancelling the confirm dialog keeps the task unchanged.

## Notifications

- [ ] Reminder notification permission prompt behaves correctly.
- [ ] Reminder notification can be scheduled.
- [ ] Reminder notification is received.
- [ ] Update notification appears for users when expected.
- [ ] Update notification does not repeatedly appear after being handled.
- [ ] Push token/subscription is saved.
- [ ] Existing push token/subscription is reused or refreshed correctly.

## Offline And Service Worker

- [ ] App loads while online.
- [ ] App loads after refresh.
- [ ] App opens in installed PWA mode.
- [ ] App shows expected behavior when offline.
- [ ] Previously cached assets load offline where expected.
- [ ] New deployment updates cached assets correctly.
- [ ] Service worker does not trap users on an old broken version.

## Regression Pass

- [ ] Main dashboard still loads.
- [ ] Task lists still render.
- [ ] Buttons and forms remain touch-friendly on mobile.
- [ ] No obvious console errors during normal use.
- [ ] No broken icons or missing PWA assets.
