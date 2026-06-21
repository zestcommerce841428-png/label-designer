/**
 * GET /api/health
 *
 * Returns 200 {"status":"healthy",...} when all services are reachable,
 * or 503 {"status":"degraded",...} if the database is unavailable.
 *
 * Used by load balancers, uptime monitors, and deployment health checks.
 * Does NOT require authentication.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  const checks: Record<string, 'ok' | 'degraded' | 'down'> = { api: 'ok' }
  let httpStatus = 200

  // Database reachability
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('labels').select('id').limit(1).maybeSingle()
    // maybeSingle() returns null row (not error) when table is empty — that's fine
    checks.database = error ? 'degraded' : 'ok'
    if (error) httpStatus = 503
  } catch {
    checks.database = 'down'
    httpStatus = 503
  }

  return NextResponse.json(
    {
      status:    httpStatus === 200 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - started,
      checks,
    },
    { status: httpStatus },
  )
}
