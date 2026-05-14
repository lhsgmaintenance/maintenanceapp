# LH Maintenance Live Version Plan

## Target Flow

1. Staff register or sign in with their own email address.
2. Admin creates and assigns a maintenance task.
3. Optional task attachment can be added during assignment.
4. Staff starts work, ends work, enters the completion update, then clicks Submit Done.
5. The app generates a completion PDF.
6. The PDF is stored in the configured Google Drive folder.
7. The PDF or Drive link is emailed to the task admin or assigner email address.

## Recommended Internal Setup

- Use Google sign-in for staff identity.
- Use Google Drive for PDF and attachment storage.
- Use Google Sheets or Firestore for task records.
- Use Google Apps Script, Cloud Functions, or a small Node backend for Drive upload and email sending.

## Required Configuration

- Google Cloud project or Apps Script project.
- OAuth consent and allowed internal users.
- Drive folder ID for completed PDFs.
- Email sender account or Gmail API permission.
- Admin or assigner email field on each work order.

## Current Desktop Version

- Runs locally in the browser.
- Stores records in browser local storage.
- Supports optional work order attachments.
- Supports assignee email, admin email, and local user email fields.
- Generates a printable completion report, but does not yet upload to Drive or send email automatically.
