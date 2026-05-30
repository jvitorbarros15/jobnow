import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'fs'
import path from 'path'

export const maxDuration = 300

async function loadAgentSystemPrompt(): Promise<string> {
  const agentPath = path.join(process.cwd(), '.claude', 'agents', 'job-search-agent.md')
  const content = await fs.readFile(agentPath, 'utf-8')
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '')
  return withoutFrontmatter.split('# Persistent Agent Memory')[0].trim()
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('agent_job_searches')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ result: data || null })
  } catch (error) {
    console.error('GET /api/jobs/agent-search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let searchId: string | null = null

  try {
    const systemPrompt = await loadAgentSystemPrompt()

    const { data: insertedRow, error: insertError } = await supabase
      .from('agent_job_searches')
      .insert({
        user_id: user.id,
        status: 'running',
        results: [],
        summary: '',
        sources_searched: 0,
        completed_at: null,
      })
      .select('id, created_at')
      .single()

    if (insertError || !insertedRow?.id) {
      return NextResponse.json(
        { error: `Failed to create search record: ${insertError?.message ?? 'no row returned'}` },
        { status: 500 }
      )
    }
    searchId = insertedRow.id

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const userPrompt = `Run a fresh job search following your complete protocol. Search all sources in your instructions.

After completing your research, output your findings in your standard format, then close with this exact JSON block:
\`\`\`json
{
  "results": [
    {
      "id": "result-1",
      "title": "Job Title",
      "company": "Company Name",
      "location": "Remote or City, State",
      "remote": true,
      "url": "https://direct-apply-link",
      "source": "LinkedIn",
      "fit_score": 9,
      "sponsorship_status": "likely",
      "fit_summary": "One sentence about why this fits.",
      "priority": "high",
      "action_items": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "summary": "Brief market snapshot paragraph.",
  "sources_searched": 47
}
\`\`\`

Include your top 10 results sorted by fit_score descending.`

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }]
    let finalText = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }]

    for (let turn = 0; turn < 20; turn++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        tools,
        messages,
      })

      for (const block of response.content) {
        if (block.type === 'text') {
          finalText += block.text
        }
      }

      const reason = response.stop_reason
      if (reason === 'end_turn' || reason === 'max_tokens') break

      // Add assistant turn so the next call continues the conversation
      messages.push({ role: 'assistant', content: response.content })

      if (reason === 'pause_turn') {
        // Server-side tool (web_search) paused mid-turn — no client action needed, just continue
        continue
      }

      if (reason === 'tool_use') {
        // Only provide tool_result for client-side tool_use blocks (not server_tool_use)
        const clientToolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        )
        if (clientToolUseBlocks.length > 0) {
          messages.push({
            role: 'user',
            content: clientToolUseBlocks.map(b => ({
              type: 'tool_result' as const,
              tool_use_id: b.id,
              content: '',
            })),
          })
        }
      } else {
        break
      }
    }

    const jsonMatch = finalText.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      throw new Error('Agent did not return structured results')
    }

    const agentResult = JSON.parse(jsonMatch[1])
    const results = Array.isArray(agentResult.results) ? agentResult.results : []
    const summary = typeof agentResult.summary === 'string' ? agentResult.summary : ''
    const sourcesSearched = typeof agentResult.sources_searched === 'number'
      ? agentResult.sources_searched
      : results.length

    const { data: updatedRow, error: updateError } = await supabase
      .from('agent_job_searches')
      .update({
        status: 'complete',
        results,
        summary,
        sources_searched: sourcesSearched,
        completed_at: new Date().toISOString(),
      })
      .eq('id', searchId)
      .select()
      .single()

    if (updateError) throw new Error(`Failed to save results: ${updateError.message}`)

    return NextResponse.json({ result: updatedRow }, { status: 200 })
  } catch (error) {
    console.error('POST /api/jobs/agent-search error:', error)

    if (searchId) {
      try {
        await supabase
          .from('agent_job_searches')
          .update({ status: 'failed', completed_at: new Date().toISOString() })
          .eq('id', searchId)
      } catch {
        // best effort
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
