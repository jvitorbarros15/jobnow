import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractAtsKeywords } from '@/lib/jobs'
import { selectResumeSubset, classifyJobCategory, checkVisaWarning, generateLatexResume } from '@/lib/resume'

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

    const keywords = await extractAtsKeywords(job_description)
    const category = classifyJobCategory(job_description)
    const { visa_warning, reason: visa_warning_reason } = checkVisaWarning(job_description)
    const subset = selectResumeSubset(category, keywords)
    const latex_code = generateLatexResume(subset, category, keywords)

    const matched = keywords.filter(kw => latex_code.toLowerCase().includes(kw.toLowerCase()))
    const missing = keywords.filter(kw => !latex_code.toLowerCase().includes(kw.toLowerCase()))
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
