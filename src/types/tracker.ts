export interface JobApplication {
  id: string
  user_id: string
  company: string
  role: string
  status: 'applied' | 'interview_scheduled' | 'interview_completed' | 'offer' | 'rejected' | 'ghosted' | 'follow_up_needed' | 'unknown'
  date: string | null
  recruiter_name: string | null
  recruiter_email: string | null
  notes: string | null
  next_action: string | null
  gmail_thread_id: string | null
  gmail_thread_url: string | null
  confidence: number | null
  synced_to_sheets: boolean
  calendar_event_id: string | null
  interview_datetime: string | null
  interview_location: string | null
  alert_sent: boolean
  created_at: string
  updated_at: string
}
