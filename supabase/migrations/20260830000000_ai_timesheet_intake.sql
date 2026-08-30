-- AI-assisted timesheet intake: additive, backwards-compatible audit fields.
-- Existing frontend records remain valid and retain the default source of 'frontend'.

ALTER TABLE public.timesheet_entries
  ADD COLUMN IF NOT EXISTS external_intake_id uuid,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'frontend';

CREATE UNIQUE INDEX IF NOT EXISTS timesheet_entries_external_intake_id_unique
  ON public.timesheet_entries (external_intake_id)
  WHERE external_intake_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS timesheet_entries_user_date_idx
  ON public.timesheet_entries (user_id, date);

COMMENT ON COLUMN public.timesheet_entries.external_intake_id IS
  'Immutable idempotency key for controlled external intake requests.';

COMMENT ON COLUMN public.timesheet_entries.source IS
  'Origin of the entry, such as frontend or ai_intake.';
