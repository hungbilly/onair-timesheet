import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_REQUEST_AGE_MS = 5 * 60 * 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('')

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
}

function sameValue(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function normaliseText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function asPositiveNumber(value: unknown, fieldName: string) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${fieldName} must be a positive number.`)
  return number
}

function asOptionalTime(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value)
  if (!TIME_PATTERN.test(text)) throw new Error(`${fieldName} must be HH:MM or HH:MM:SS.`)
  return text
}

function minutesSinceMidnight(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return minutesSinceMidnight(aStart) < minutesSinceMidnight(bEnd) && minutesSinceMidnight(bStart) < minutesSinceMidnight(aEnd)
}

type IntakePayload = {
  external_intake_id: string
  employee_name_input: string
  create_staff_if_missing?: boolean
  date: string
  work_type: 'hourly' | 'job'
  job_description: string
  start_time?: string | null
  end_time?: string | null
  hours?: number | null
  hourly_rate?: number | null
  job_count?: number | null
  job_rate?: number | null
}

function validatePayload(raw: Record<string, unknown>): IntakePayload {
  const external_intake_id = String(raw.external_intake_id ?? '')
  const employee_name_input = String(raw.employee_name_input ?? '').trim()
  const date = String(raw.date ?? '')
  const work_type = raw.work_type === 'job' ? 'job' : raw.work_type === 'hourly' ? 'hourly' : null
  const job_description = String(raw.job_description ?? '').trim()

  if (!UUID_PATTERN.test(external_intake_id)) throw new Error('external_intake_id must be a UUID.')
  if (employee_name_input.length < 2) throw new Error('employee_name_input is required.')
  if (!DATE_PATTERN.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) throw new Error('date must be a valid YYYY-MM-DD value.')
  if (!work_type) throw new Error('work_type must be hourly or job.')
  if (!job_description) throw new Error('job_description is required.')

  const start_time = asOptionalTime(raw.start_time, 'start_time')
  const end_time = asOptionalTime(raw.end_time, 'end_time')
  if ((start_time && !end_time) || (!start_time && end_time)) throw new Error('start_time and end_time must be supplied together.')
  if (start_time && end_time && minutesSinceMidnight(start_time) >= minutesSinceMidnight(end_time)) {
    throw new Error('end_time must be later than start_time.')
  }

  if (work_type === 'hourly') {
    return {
      external_intake_id,
      employee_name_input,
      create_staff_if_missing: raw.create_staff_if_missing === true,
      date,
      work_type,
      job_description,
      start_time,
      end_time,
      hours: asPositiveNumber(raw.hours, 'hours'),
      hourly_rate: asPositiveNumber(raw.hourly_rate, 'hourly_rate'),
      job_count: null,
      job_rate: null,
    }
  }

  return {
    external_intake_id,
    employee_name_input,
    create_staff_if_missing: raw.create_staff_if_missing === true,
    date,
    work_type,
    job_description,
    start_time,
    end_time,
    hours: null,
    hourly_rate: null,
    job_count: asPositiveNumber(raw.job_count, 'job_count'),
    job_rate: asPositiveNumber(raw.job_rate, 'job_rate'),
  }
}

async function resolveEmployee(
  supabase: ReturnType<typeof createClient>,
  inputName: string,
  createIfMissing: boolean,
) {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'staff')

  if (error) throw new Error(`Employee lookup failed: ${error.message}`)

  const wanted = normaliseText(inputName)
  const exact = (profiles ?? []).filter((profile) => normaliseText(profile.full_name) === wanted || normaliseText(profile.email) === wanted)
  const partial = (profiles ?? []).filter((profile) => normaliseText(profile.full_name).includes(wanted))
  const matches = exact.length ? exact : partial

  if (matches.length === 1) return { outcome: 'resolved' as const, employee: matches[0], created: false }
  if (matches.length > 1) {
    return {
      outcome: 'needs_review' as const,
      reason: 'Employee name is ambiguous. Use the full staff name.',
      candidates: matches.map(({ id, full_name, email }) => ({ id, full_name, email })),
    }
  }
  if (!createIfMissing) return { outcome: 'needs_review' as const, reason: 'Employee could not be uniquely resolved.' }

  const generatedEmail = `one-off-${crypto.randomUUID()}@onair.local`
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: generatedEmail,
    email_confirm: true,
    user_metadata: { full_name: inputName, worker_type: 'one_off', login_provided: false },
  })
  if (createError || !createdUser.user) throw new Error(`Could not create one-off staff identity: ${createError?.message ?? 'No user returned.'}`)

  const profile = {
    id: createdUser.user.id,
    full_name: inputName,
    email: generatedEmail,
    role: 'staff',
    updated_at: new Date().toISOString(),
  }
  const { data: savedProfile, error: profileError } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('id, full_name, email, role')
    .single()
  if (profileError) throw new Error(`Could not create one-off staff profile: ${profileError.message}`)

  return { outcome: 'resolved' as const, employee: savedProfile, created: true }
}

function sameNumber(left: number | null, right: number | null) {
  if (left === null || left === undefined || right === null || right === undefined) return left === right
  return Number(left) === Number(right)
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const sharedSecret = Deno.env.get('SHEET_MIRROR_SHARED_SECRET')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!sharedSecret || !serviceRoleKey || !supabaseUrl) return json({ error: 'Server configuration is incomplete.' }, 500)

  const timestamp = request.headers.get('x-boa-timestamp')
  const signature = request.headers.get('x-boa-signature')
  const bodyText = await request.text()
  const timestampMs = Number(timestamp)
  if (!timestamp || !signature || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_REQUEST_AGE_MS) {
    return json({ error: 'Request signature is missing or expired.' }, 401)
  }
  if (!sameValue(signature, await hmacHex(sharedSecret, `${timestamp}.${bodyText}`))) {
    return json({ error: 'Request signature is invalid.' }, 401)
  }

  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(bodyText)
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400)
  }

  let input: IntakePayload
  try {
    input = validatePayload(raw)
  } catch (error) {
    return json({ outcome: 'needs_review', reason: error instanceof Error ? error.message : String(error) }, 422)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  try {
    const { data: existingByIntakeId, error: idempotencyError } = await supabase
      .from('timesheet_entries')
      .select('id, user_id, date, work_type, job_description, hours, hourly_rate, start_time, end_time, job_count, job_rate, total_salary')
      .eq('external_intake_id', input.external_intake_id)
      .maybeSingle()
    if (idempotencyError) throw new Error(`Idempotency lookup failed: ${idempotencyError.message}`)
    if (existingByIntakeId) return json({ outcome: 'synced', idempotent: true, record: existingByIntakeId })

    const employeeResult = await resolveEmployee(supabase, input.employee_name_input, Boolean(input.create_staff_if_missing))
    if (employeeResult.outcome !== 'resolved') return json(employeeResult, 409)
    const employee = employeeResult.employee

    const { data: existingEntries, error: existingError } = await supabase
      .from('timesheet_entries')
      .select('id, work_type, job_description, hours, hourly_rate, start_time, end_time, job_count, job_rate, total_salary')
      .eq('user_id', employee.id)
      .eq('date', input.date)
    if (existingError) throw new Error(`Duplicate lookup failed: ${existingError.message}`)

    const exactDuplicate = (existingEntries ?? []).find((entry) =>
      entry.work_type === input.work_type &&
      normaliseText(entry.job_description) === normaliseText(input.job_description) &&
      sameNumber(entry.hours, input.hours ?? null) &&
      sameNumber(entry.hourly_rate, input.hourly_rate ?? null) &&
      sameNumber(entry.job_count, input.job_count ?? null) &&
      sameNumber(entry.job_rate, input.job_rate ?? null) &&
      (entry.start_time ?? null) === input.start_time &&
      (entry.end_time ?? null) === input.end_time,
    )
    if (exactDuplicate) {
      return json({ outcome: 'exact_duplicate', reason: 'An identical active timesheet entry already exists.', employee, record: exactDuplicate })
    }

    const overlappingEntry = input.start_time && input.end_time
      ? (existingEntries ?? []).find((entry) => entry.start_time && entry.end_time && periodsOverlap(input.start_time!, input.end_time!, entry.start_time, entry.end_time))
      : null
    if (overlappingEntry) {
      return json({ outcome: 'needs_review', reason: 'Work period overlaps an existing entry.', employee, record: overlappingEntry }, 409)
    }

    const likelyDuplicate = (existingEntries ?? []).find((entry) =>
      entry.work_type === input.work_type &&
      normaliseText(entry.job_description) !== normaliseText(input.job_description) &&
      sameNumber(entry.hours, input.hours ?? null) &&
      sameNumber(entry.hourly_rate, input.hourly_rate ?? null) &&
      sameNumber(entry.job_count, input.job_count ?? null) &&
      sameNumber(entry.job_rate, input.job_rate ?? null),
    )
    if (likelyDuplicate) {
      return json({ outcome: 'needs_review', reason: 'Same employee, date, work values and pay rate as an existing entry, but the job description differs.', employee, record: likelyDuplicate }, 409)
    }

    const totalSalary = input.work_type === 'hourly'
      ? Number(input.hours) * Number(input.hourly_rate)
      : Number(input.job_count) * Number(input.job_rate)

    const { data: createdEntry, error: insertError } = await supabase
      .from('timesheet_entries')
      .insert({
        external_intake_id: input.external_intake_id,
        source: 'ai_intake',
        user_id: employee.id,
        date: input.date,
        work_type: input.work_type,
        job_description: input.job_description,
        start_time: input.start_time,
        end_time: input.end_time,
        hours: input.hours,
        hourly_rate: input.hourly_rate,
        job_count: input.job_count,
        job_rate: input.job_rate,
        total_salary: totalSalary,
      })
      .select('id, user_id, date, work_type, job_description, hours, hourly_rate, start_time, end_time, job_count, job_rate, total_salary, external_intake_id, source')
      .single()

    if (insertError?.code === '23505') {
      const { data: racedEntry, error: raceError } = await supabase
        .from('timesheet_entries')
        .select('id, user_id, date, work_type, job_description, hours, hourly_rate, start_time, end_time, job_count, job_rate, total_salary')
        .eq('external_intake_id', input.external_intake_id)
        .maybeSingle()
      if (raceError || !racedEntry) throw new Error(`Duplicate recovery failed: ${raceError?.message ?? insertError.message}`)
      return json({ outcome: 'synced', idempotent: true, record: racedEntry })
    }
    if (insertError) throw new Error(`Timesheet insert failed: ${insertError.message}`)

    return json({ outcome: 'synced', idempotent: false, employee, employee_created: employeeResult.created, record: createdEntry })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
