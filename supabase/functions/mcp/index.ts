// MCP (Model Context Protocol) server for onair-timesheet.
// Streamable HTTP transport, JSON-RPC 2.0.
// Auth: the caller must send `Authorization: Bearer <supabase user access token>`.
// The token is forwarded to Supabase so all queries run under that user's RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const SERVER_INFO = {
  name: 'onair-timesheet',
  title: 'onair-timesheet',
  version: '0.1.0',
}

const INSTRUCTIONS =
  'Tools for the onair-timesheet app. Read and log timesheet entries and expenses, ' +
  'and get monthly totals for the signed-in user. All data is scoped to the authenticated user.'

type Tool = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: Record<string, boolean>
  handler: (args: Record<string, any>, db: ReturnType<typeof createClient>, userId: string) => Promise<unknown>
}

const monthRange = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  const start = `${month}-01`
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1))
  return { start, end: end.toISOString().slice(0, 10) }
}

const tools: Tool[] = [
  {
    name: 'list_timesheet_entries',
    title: 'List timesheet entries',
    description: 'List the signed-in user\'s timesheet entries, optionally filtered by month (YYYY-MM).',
    inputSchema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Month filter in YYYY-MM format.' },
        limit: { type: 'number', description: 'Max rows to return (default 50).' },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ month, limit }, db) => {
      let q = db.from('timesheet_entries').select('*').order('date', { ascending: false })
      if (month) {
        const { start, end } = monthRange(month)
        q = q.gte('date', start).lt('date', end)
      }
      const { data, error } = await q.limit(Math.min(Number(limit) || 50, 200))
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: 'log_timesheet_entry',
    title: 'Log a timesheet entry',
    description: 'Create a timesheet entry for the signed-in user. Use work_type "hourly" with hours + hourly_rate, or "job" with job_count + job_rate.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Entry date, YYYY-MM-DD.' },
        job_description: { type: 'string' },
        work_type: { type: 'string', description: '"hourly" or "job".' },
        hours: { type: 'number' },
        hourly_rate: { type: 'number' },
        job_count: { type: 'number' },
        job_rate: { type: 'number' },
        start_time: { type: 'string' },
        end_time: { type: 'string' },
      },
      required: ['date', 'job_description', 'work_type'],
    },
    annotations: { readOnlyHint: false },
    handler: async (a, db, userId) => {
      const work_type = a.work_type === 'job' ? 'job' : 'hourly'
      const total_salary =
        work_type === 'hourly'
          ? Number(a.hours || 0) * Number(a.hourly_rate || 0)
          : Number(a.job_count || 0) * Number(a.job_rate || 0)
      const { data, error } = await db
        .from('timesheet_entries')
        .insert({
          user_id: userId,
          date: a.date,
          job_description: a.job_description,
          work_type,
          hours: a.hours ?? null,
          hourly_rate: a.hourly_rate ?? null,
          job_count: a.job_count ?? null,
          job_rate: a.job_rate ?? null,
          start_time: a.start_time ?? null,
          end_time: a.end_time ?? null,
          total_salary,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: 'list_expenses',
    title: 'List expenses',
    description: 'List the signed-in user\'s expenses, optionally filtered by month (YYYY-MM).',
    inputSchema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Month filter in YYYY-MM format.' },
        limit: { type: 'number', description: 'Max rows to return (default 50).' },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ month, limit }, db) => {
      let q = db.from('expenses').select('*').order('date', { ascending: false })
      if (month) {
        const { start, end } = monthRange(month)
        q = q.gte('date', start).lt('date', end)
      }
      const { data, error } = await q.limit(Math.min(Number(limit) || 50, 200))
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: 'log_expense',
    title: 'Log an expense',
    description: 'Create an expense record for the signed-in user.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Expense date, YYYY-MM-DD.' },
        description: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['date', 'description', 'amount'],
    },
    annotations: { readOnlyHint: false },
    handler: async (a, db, userId) => {
      const { data, error } = await db
        .from('expenses')
        .insert({ user_id: userId, date: a.date, description: a.description, amount: Number(a.amount) })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: 'monthly_summary',
    title: 'Monthly summary',
    description: 'Total salary earned, hours worked and expenses for the signed-in user in a given month (YYYY-MM).',
    inputSchema: {
      type: 'object',
      properties: { month: { type: 'string', description: 'Month in YYYY-MM format.' } },
      required: ['month'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ month }, db) => {
      const { start, end } = monthRange(month)
      const [entries, expenses] = await Promise.all([
        db.from('timesheet_entries').select('hours,total_salary').gte('date', start).lt('date', end),
        db.from('expenses').select('amount').gte('date', start).lt('date', end),
      ])
      if (entries.error) throw new Error(entries.error.message)
      if (expenses.error) throw new Error(expenses.error.message)
      const rows = (entries.data ?? []) as { hours: number | null; total_salary: number }[]
      const exp = (expenses.data ?? []) as { amount: number }[]
      return {
        month,
        entry_count: rows.length,
        total_hours: rows.reduce((s, r) => s + Number(r.hours || 0), 0),
        total_salary: rows.reduce((s, r) => s + Number(r.total_salary || 0), 0),
        total_expenses: exp.reduce((s, r) => s + Number(r.amount || 0), 0),
      }
    },
  },
]

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result })
const rpcError = (id: unknown, code: number, message: string) => ({
  jsonrpc: '2.0',
  id,
  error: { code, message },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return json({ error: 'Use POST with JSON-RPC (MCP Streamable HTTP).' }, 405)
  }

  let message: any
  try {
    message = await req.json()
  } catch {
    return json(rpcError(null, -32700, 'Parse error'), 400)
  }

  const { id, method, params } = message ?? {}

  // Notifications carry no id — acknowledge without a body.
  if (id === undefined || id === null) {
    return new Response(null, { status: 202, headers: corsHeaders })
  }

  if (method === 'initialize') {
    return json(
      rpcResult(id, {
        protocolVersion: params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      }),
    )
  }

  if (method === 'ping') return json(rpcResult(id, {}))

  if (method === 'tools/list') {
    return json(
      rpcResult(id, {
        tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations,
        })),
      }),
    )
  }

  if (method === 'tools/call') {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    if (!token) {
      return new Response(
        JSON.stringify(rpcError(id, -32001, 'Unauthorized: missing bearer token')),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="onair-timesheet"',
          },
        },
      )
    }

    const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await db.auth.getUser(token)
    if (userError || !userData?.user) {
      return json(rpcError(id, -32001, 'Unauthorized: invalid or expired token'), 401)
    }

    const tool = tools.find((t) => t.name === params?.name)
    if (!tool) return json(rpcError(id, -32602, `Unknown tool: ${params?.name}`))

    try {
      const result = await tool.handler(params?.arguments ?? {}, db, userData.user.id)
      return json(
        rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: { result },
        }),
      )
    } catch (e) {
      return json(
        rpcResult(id, {
          content: [{ type: 'text', text: (e as Error).message }],
          isError: true,
        }),
      )
    }
  }

  return json(rpcError(id, -32601, `Method not found: ${method}`))
})
