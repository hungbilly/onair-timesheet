-- Payroll safety guard for all timesheet write paths.
-- Serializes inserts for the same employee/date so frontend and AI requests
-- cannot both pass a duplicate check before either row becomes visible.

CREATE OR REPLACE FUNCTION public.guard_timesheet_entry_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  conflicting_entry record;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.user_id::text || ':' || NEW.date::text, 0)
  );

  SELECT
    e.id,
    e.source,
    e.work_type,
    e.job_description,
    e.start_time,
    e.end_time,
    e.hours,
    e.hourly_rate,
    e.job_count,
    e.job_rate
  INTO conflicting_entry
  FROM public.timesheet_entries e
  WHERE e.user_id = NEW.user_id
    AND e.date = NEW.date
    AND (
      (
        NEW.start_time IS NOT NULL
        AND NEW.end_time IS NOT NULL
        AND e.start_time IS NOT NULL
        AND e.end_time IS NOT NULL
        AND NEW.start_time < e.end_time
        AND e.start_time < NEW.end_time
      )
      OR
      (
        e.work_type = NEW.work_type
        AND lower(regexp_replace(btrim(e.job_description), '[[:space:]]+', ' ', 'g')) =
            lower(regexp_replace(btrim(NEW.job_description), '[[:space:]]+', ' ', 'g'))
        AND e.hours IS NOT DISTINCT FROM NEW.hours
        AND e.hourly_rate IS NOT DISTINCT FROM NEW.hourly_rate
        AND e.job_count IS NOT DISTINCT FROM NEW.job_count
        AND e.job_rate IS NOT DISTINCT FROM NEW.job_rate
        AND (
          NEW.start_time IS NULL
          OR NEW.end_time IS NULL
          OR e.start_time IS NULL
          OR e.end_time IS NULL
          OR (e.start_time = NEW.start_time AND e.end_time = NEW.end_time)
        )
      )
    )
  ORDER BY e.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'TIMESHEET_DUPLICATE_GUARD',
      DETAIL = format(
        'Potential duplicate or overlapping timesheet detected against existing entry %s.',
        conflicting_entry.id
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS timesheet_entries_duplicate_guard ON public.timesheet_entries;

CREATE TRIGGER timesheet_entries_duplicate_guard
BEFORE INSERT ON public.timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION public.guard_timesheet_entry_insert();

COMMENT ON FUNCTION public.guard_timesheet_entry_insert() IS
  'Serializes same-employee/day inserts and blocks overlapping or ambiguous duplicate timesheet rows from any write path.';
