import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DigestPanel from '@/components/home/DigestPanel'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 5)
  const { error: cleanupError } = await supabase
    .from('digests')
    .delete()
    .eq('user_id', user.id)
    .lt('date', cutoff.toISOString().split('T')[0])
  if (cleanupError) console.error('digest cleanup failed:', cleanupError.message)

  const [{ data: emailDigests }, { data: newsDigests }, { data: applications }] = await Promise.all([
    supabase
      .from('digests')
      .select('id, slot, date, content')
      .eq('user_id', user.id)
      .eq('type', 'email')
      .order('date', { ascending: false })
      .order('slot', { ascending: false })
      .limit(14),
    supabase
      .from('digests')
      .select('id, slot, date, content')
      .eq('user_id', user.id)
      .eq('type', 'news')
      .order('date', { ascending: false })
      .order('slot', { ascending: false })
      .limit(14),
    supabase
      .from('job_applications')
      .select('status')
      .eq('user_id', user.id),
  ])

  const active     = (applications ?? []).filter((a) => a.status !== 'unknown')
  const interviews = (applications ?? []).filter((a) =>
    a.status === 'interview_scheduled' || a.status === 'interview_completed'
  )
  const offers     = (applications ?? []).filter((a) => a.status === 'offer')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="flex items-baseline justify-between opacity-0"
        style={{ animation: 'fadeInUp 0.35s ease 0ms forwards' }}
      >
        <h1 className="font-display text-2xl font-bold text-text tracking-tight">Home</h1>
        {active.length > 0 && (
          <div className="flex items-center gap-2.5 text-xs font-mono text-muted">
            <span>
              <span className="font-semibold text-text">{active.length}</span>
              <span className="ml-1">applied</span>
            </span>
            {interviews.length > 0 && (
              <>
                <span className="text-muted-2 select-none">·</span>
                <span>
                  <span className="font-semibold text-accent">{interviews.length}</span>
                  <span className="ml-1">interviewing</span>
                </span>
              </>
            )}
            {offers.length > 0 && (
              <>
                <span className="text-muted-2 select-none">·</span>
                <span>
                  <span className="font-semibold text-text">{offers.length}</span>
                  <span className="ml-1">{offers.length === 1 ? 'offer' : 'offers'}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Two-column panels */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 opacity-0"
        style={{ animation: 'fadeInUp 0.35s ease 80ms forwards' }}
      >
        <DigestPanel
          label="Email Digest"
          type="email"
          digests={emailDigests ?? []}
        />
        <DigestPanel
          label="News + Drafts"
          type="news"
          digests={newsDigests ?? []}
        />
      </div>
    </div>
  )
}
