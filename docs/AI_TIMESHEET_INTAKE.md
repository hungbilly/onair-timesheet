# AI Timesheet Intake

## Purpose

This workflow allows the administrator to provide one-off staff work details in Manus without asking the worker to use the Timesheet front end. Manus places the normalized request into the `AI Timesheet Intake` tab of the **Onair Timesheet Mirror** spreadsheet. A bound Google Apps Script validates and submits the request to the protected `timesheet-admin-intake` Supabase Edge Function.

> **Supabase remains the source of truth.** The intake sheet is an auditable staging queue; the existing front end and the existing mirror continue to read their records from Supabase.

## Normal use

Send the details to Manus in Cantonese or English. Provide an exact existing staff name whenever possible. For a brand-new one-day worker, state that they are a **new one-off staff member** so the request can set `create_staff_if_missing` to `TRUE`.

### Hourly work example

```text
Ivy Mak worked on 2026-09-02 as a studio assistant for the Chan family shoot.
11:00–19:00, 8 hours at HK$150 per hour.
```

### Fixed-fee / job-rate example

```text
New one-off staff: Alex Chan.
Worked on 2026-09-02 as a lighting assistant for the Chan family shoot.
One job at HK$1,200.
```

For reliable processing, each request needs a staff name, work date, work description, work type, and either:

| Work type | Required pay fields | Helpful optional fields |
|---|---|---|
| `hourly` | `hours` and `hourly_rate` | `start_time` and `end_time` |
| `job` | `job_count` and `job_rate` | `start_time` and `end_time` |

All dates are recorded as `YYYY-MM-DD`. Use Hong Kong local time for work times.

## Workflow

| Stage | System behavior |
|---|---|
| Manus intake | Normalizes the message and creates one `Pending` row with a permanent `external_intake_id`. |
| Google Sheet queue | Holds the request and displays audit fields, calculations, review outcomes, and errors. |
| Apps Script | Processes only `Pending` rows, signs the request with the existing secret, and never exposes that secret in the sheet. |
| Supabase Edge Function | Validates values, resolves staff, detects duplicates/overlaps, performs an idempotency check, and inserts the official entry only when safe. |
| Existing application | Shows the inserted entry normally in front-end reports, monthly payroll, and the existing Supabase-to-Sheets mirror. |

## Status meanings

| `intake_status` | Meaning | What to do |
|---|---|---|
| `Pending` | Ready for processing. | Leave it for the next manual processor run. |
| `Processing` | A run has started. | Wait; the script uses a lock to prevent concurrent processing. |
| `Synced` | A final Supabase entry was created, or a safe retry returned the existing entry. | No action needed. |
| `Exact Duplicate - Skipped` | An identical active entry was found for the employee/date/description/pay values. | No action needed unless the record was genuinely meant to be separate. |
| `Needs Review` | The employee name was ambiguous/unmatched, work times overlap, or a likely duplicate exists. | Correct the data or confirm the intended staff member, then set the row back to `Pending`. |
| `Error` | Three unsuccessful technical attempts occurred. | Review the `sync_error` column before resetting to `Pending`. |
| `Cancelled` | A request should not be processed. | Keep for audit, or create a new row if needed. |

## Duplicate and retry protections

The `external_intake_id` is generated before processing and stored in both the queue and Supabase. A network retry for the same ID returns the original official record instead of creating a second one. The endpoint also checks active entries for the same staff member and date:

| Check | Outcome |
|---|---|
| Same intake ID | Returns the existing record safely. |
| Same staff, date, work type, description, times, and pay values | `Exact Duplicate - Skipped`. |
| Overlapping recorded time period | `Needs Review`. |
| Same staff, date, work values, and pay rate but different description | `Needs Review`. |

## New one-off staff

The existing application requires a `profiles` row for Timesheets to appear normally. When the request explicitly allows creation of a new one-off staff member, the protected endpoint creates an internal staff identity and matching `profiles` entry with a generated non-login email address. No password or login is provided to that worker. Do not mark an unfamiliar name as a new staff member merely because it is misspelled; use `Needs Review` to resolve uncertainty first.

## Manual operation

The workflow is intentionally configured for **manual runs only**. In the mirror spreadsheet, choose **BOA Sync → Process AI Timesheet Intake** after Manus has created a queue row. This avoids automatic payroll changes until the workflow has been exercised with real approved data.

A recurring trigger has **not** been enabled. If needed later, a time-driven trigger can process only `Pending` rows, but it should be enabled only after the manual operating procedure is accepted.

## Implementation components

| Component | Location |
|---|---|
| Additive database migration | `supabase/migrations/20260830000000_ai_timesheet_intake.sql` |
| Protected endpoint | `supabase/functions/timesheet-admin-intake/index.ts` |
| Bound Google Apps Script | `scripts/BOA_Timesheet_Mirror.gs` |
| Live intake queue | `Onair Timesheet Mirror` → `AI Timesheet Intake` |

The endpoint relies on the existing `SHEET_MIRROR_SHARED_SECRET` server secret and the bound Apps Script’s existing `SYNC_SHARED_SECRET` script property. These values must never be placed in Google Sheet cells, version control, or chat messages.
