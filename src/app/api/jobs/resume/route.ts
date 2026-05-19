import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { extractAtsKeywords } from '@/lib/jobs'
import { selectResumeSubset, LATEX_BASE_TEMPLATE } from '@/lib/resume'
import type { JobCategory } from '@/types/jobs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_description, template, job_id } = body

    if (!job_description) {
      return NextResponse.json({ error: 'job_description is required' }, { status: 400 })
    }

    const keywords = await extractAtsKeywords(job_description)

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

    const systemPrompt = `You are a LaTeX resume generator. Generate a tailored 1-page resume for Joao Vitor Barros based on the provided profile subset and job description.

HARD RULES — follow every one without exception:
1. Output must be exactly 1 page when compiled. Cut bullets and drop lower-priority projects if needed. ZorAi and education are never cut.
2. Output is valid LaTeX only. No markdown, no prose explanation, no preamble — just the LaTeX code starting with \\documentclass.
3. Active voice in every bullet. Rewrite any passive construction.
4. Every bullet needs a concrete outcome or metric from the verified metrics list. Do not invent numbers.
5. No objective or summary section.
6. Skills section must use ATS keywords from this job. Pick 15-20 skills matching the JD.
7. No photos, colors, icons, or graphics.
8. Fonts: Computer Modern (default LaTeX). No fontspec, no XeLaTeX.
9. Margins: 0.5in all sides via geometry package.
10. Section order: Education, Experience, Projects, Technical Skills, Publications (if included).
11. ZorAi is always the first project listed. Never dropped.
12. Do not add any skill, technology, or experience not in the profile.
13. Return ONLY the LaTeX code starting with \\documentclass. Nothing else.
14. After generating, verify: does this feel written for THIS job, or a generic dump? If the latter, revise.

LaTeX base template to use:
${LATEX_BASE_TEMPLATE}`

    const userMessage = `JOB DESCRIPTION:
${job_description}

ATS KEYWORDS EXTRACTED:
${keywords.join(', ')}

JOB CATEGORY: ${category}

PROFILE SUBSET TO USE:
${JSON.stringify(subset, null, 2)}

Generate the complete LaTeX resume code.`

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
    })
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resume generation failed' },
      { status: 500 }
    )
  }
}
