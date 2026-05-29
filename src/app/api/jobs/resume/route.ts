import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createServerClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { extractAtsKeywords } from '@/lib/jobs'
import { selectResumeSubset } from '@/lib/resume'
import type { JobCategory } from '@/types/jobs'

function readDoc(filename: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'docs', filename), 'utf-8')
  } catch {
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_description, template, job_id, company_name, job_title } = body

    if (!job_description) {
      return NextResponse.json({ error: 'job_description is required' }, { status: 400 })
    }

    const profileDoc = readDoc('resume-profile.md')
    const atsDoc = readDoc('ats-seo.md')
    const builderDoc = readDoc('resume-builder.md')

    const [keywords, visaRes] = await Promise.all([
      extractAtsKeywords(job_description),
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: 'Analyze this job description for visa/work authorization requirements. Return ONLY a JSON object: {"visa_warning": boolean, "reason": "short explanation or null"}. Set visa_warning to true if the job: requires US citizenship, requires security clearance, says "no visa sponsorship", says "must be authorized to work without sponsorship", or any similar requirement that would block a visa-dependent applicant.',
        messages: [{ role: 'user', content: job_description.slice(0, 3000) }],
      }),
    ])

    let visa_warning = false
    let visa_warning_reason: string | null = null
    try {
      const visaText = visaRes.content[0].type === 'text' ? visaRes.content[0].text : '{}'
      const visaJson = JSON.parse(visaText.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
      visa_warning = visaJson.visa_warning ?? false
      visa_warning_reason = visaJson.reason ?? null
    } catch { /* ignore parse errors */ }

    const categoryRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      system: 'Classify this job description into exactly one category. Return ONLY the category name, nothing else. Categories: blockchain_web3, ai_ml, backend_fullstack, frontend, research, data_engineering, devops_infra, startup_generalist',
      messages: [{ role: 'user', content: job_description.slice(0, 2000) }],
    })
    const category: JobCategory = categoryRes.content[0].type === 'text'
      ? categoryRes.content[0].text.trim() as JobCategory
      : 'backend_fullstack'

    const subset = selectResumeSubset(category, keywords)

    const systemPrompt = `You are a professional LaTeX resume generator for Joao Vitor Barros.

You have three reference documents to guide your work:

--- RESUME PROFILE (source of truth — never fabricate anything not here) ---
${profileDoc}

--- ATS & SEO OPTIMIZATION GUIDE ---
${atsDoc}

--- RESUME BUILDER RULES (follow every rule without exception) ---
${builderDoc}

Generate a tailored 1-page LaTeX resume. Follow the hard rules in the resume builder doc exactly. Use only data from the profile doc. Apply ATS optimization from the SEO doc.`

    const userMessage = `
${company_name ? `Company: ${company_name}` : ''}
${job_title ? `Role: ${job_title}` : ''}

JOB DESCRIPTION:
${job_description}

ATS KEYWORDS EXTRACTED:
${keywords.join(', ')}

JOB CATEGORY: ${category}

SELECTED PROFILE SUBSET:
${JSON.stringify(subset, null, 2)}

Generate the complete LaTeX resume code for this specific role.
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const latexMatch = rawText.match(/\\documentclass[\s\S]*?\\end\{document\}/)
    const latex_code = latexMatch ? latexMatch[0] : rawText

    const matched = keywords.filter(kw =>
      latex_code.toLowerCase().includes(kw.toLowerCase())
    )
    const missing = keywords.filter(kw =>
      !latex_code.toLowerCase().includes(kw.toLowerCase())
    )
    const score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0

    const { data: resume, error: insertError } = await supabase.from('resumes').insert({
      user_id: user.id,
      job_id: job_id || null,
      template_used: template || 'classic_ats',
      job_category: category,
      projects_included: subset.projects.map(p => p.name),
      experience_bullets_used: {},
      latex_code,
      keyword_match_score: score,
      ats_keywords_matched: matched,
      missing_skills: missing,
    }).select().single()

    if (insertError) {
      console.error('Failed to save resume:', insertError)
      return NextResponse.json({
        resume_id: null,
        latex_code,
        keyword_match_score: score,
        matched_keywords: matched,
        missing_skills: missing,
        job_category: category,
        visa_warning,
        visa_warning_reason,
        warning: 'Resume generated but could not be saved',
      })
    }

    return NextResponse.json({
      resume_id: resume.id,
      latex_code,
      keyword_match_score: score,
      matched_keywords: matched,
      missing_skills: missing,
      job_category: category,
      visa_warning,
      visa_warning_reason,
    })
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resume generation failed' },
      { status: 500 }
    )
  }
}
