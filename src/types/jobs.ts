export type JobCategory = 'blockchain_web3' | 'ai_ml' | 'backend_fullstack' | 'frontend' | 'research' | 'data_engineering' | 'devops_infra' | 'startup_generalist'
export type ResumeTemplate = 'classic_ats' | 'modern_clean' | 'research_academic' | 'blockchain_web3'

export interface JobResult {
  id: string
  title: string
  company: string
  location: string
  salary: string | null
  source: 'Indeed' | 'ZipRecruiter' | 'LinkedIn' | 'Glassdoor'
  url: string
  posted_at: string
  description: string
  ats_keywords: string[]
  remote: boolean
}

export interface SavedJob {
  id: string
  user_id: string
  title: string
  company: string
  location: string | null
  salary: string | null
  source: 'Indeed' | 'ZipRecruiter' | 'LinkedIn' | 'Glassdoor'
  url: string
  posted_at: string | null
  description: string | null
  ats_keywords: string[]
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  job_id: string | null
  job_title: string | null
  company: string | null
  template_used: ResumeTemplate
  job_category: JobCategory
  projects_included: string[]
  experience_bullets_used: Record<string, string[]>
  latex_code: string
  keyword_match_score: number | null
  ats_keywords_matched: string[]
  missing_skills: string[]
  created_at: string
}
