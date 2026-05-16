import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function createMiddlewareSupabaseClient(
  req: NextRequest,
  res: NextResponse
) {
  return createMiddlewareClient<Database>({ req, res })
}
