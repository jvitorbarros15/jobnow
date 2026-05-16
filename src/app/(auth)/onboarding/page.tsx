'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import ProfileStep from '@/components/onboarding/ProfileStep'
import GmailStep from '@/components/onboarding/GmailStep'
import TimezoneStep from '@/components/onboarding/TimezoneStep'
import ApiKeysStep from '@/components/onboarding/ApiKeysStep'
import GoogleSheetStep from '@/components/onboarding/GoogleSheetStep'

let supabase: SupabaseClient | null = null

const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabase
}

const STEPS = [
  { id: 1, title: 'Profile Confirmation' },
  { id: 2, title: 'Connect Gmail' },
  { id: 3, title: 'Timezone' },
  { id: 4, title: 'API Keys' },
  { id: 5, title: 'Google Sheet' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const checkUser = async () => {
      const supabaseClient = getSupabaseClient()
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router])

  const handleNext = async () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsLoading(true)
      router.push('/tracker')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/tracker')
    }
  }

  if (!mounted || !user) {
    return null
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProfileStep user={user} onNext={handleNext} />
      case 2:
        return <GmailStep user={user} onNext={handleNext} />
      case 3:
        return <TimezoneStep user={user} onNext={handleNext} />
      case 4:
        return <ApiKeysStep user={user} onNext={handleNext} onSkip={handleSkip} />
      case 5:
        return <GoogleSheetStep user={user} onNext={handleNext} onSkip={handleSkip} />
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-white overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(108, 99, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(108, 99, 255, 0.05) 0%, transparent 50%),
              linear-gradient(45deg, transparent 30%, rgba(108, 99, 255, 0.02) 50%, transparent 70%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-light mb-2 tracking-tight">Welcome to JobMaker</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 mb-8" />
          <p className="text-muted text-sm">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-3 mb-12">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx < currentStep
                  ? 'bg-accent'
                  : idx === currentStep - 1
                    ? 'bg-accent scale-125'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-12 min-h-[400px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            className="px-6 py-2 rounded-lg border border-border hover:border-accent hover:bg-surface/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium"
          >
            Back
          </button>

          {(currentStep === 4 || currentStep === 5) && (
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg text-muted hover:text-white transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              Skip
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-8 py-2 rounded-lg bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white ml-auto"
          >
            {isLoading ? 'Loading...' : currentStep === 5 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
