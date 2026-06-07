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
  review_score: number | null
  review_keywords: string[]
  review_red_flags: Array<{ flag: string; cost: string }>
  reviewed_latex: string | null
  created_at: string
}

export interface AgentJobResult {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  url: string
  source: string
  fit_score: number
  sponsorship_status: 'confirmed' | 'likely' | 'unknown' | 'no'
  fit_summary: string
  priority: 'high' | 'medium' | 'low'
  action_items: string[]
}

export interface AgentSearchResult {
  id: string
  status: 'running' | 'complete' | 'failed'
  results: AgentJobResult[]
  summary: string
  sources_searched: number
  created_at: string
  completed_at: string | null
}

export interface ResumeRequest {
  id: string
  user_id: string
  job_title: string
  company: string
  job_description: string
  template: string
  status: 'pending' | 'building' | 'reviewing' | 'complete' | 'failed'
  resume_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}
