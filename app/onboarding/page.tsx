'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectKalshi } from '@/components/onboarding/connect-kalshi'
import { Preferences } from '@/components/onboarding/preferences'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Kalshi Auto-Sell</h1>
          <p className="text-muted-foreground">Step {step} of 2</p>
        </div>

        {step === 1 && <ConnectKalshi onNext={handleNext} />}
        {step === 2 && <Preferences onComplete={handleComplete} />}
      </div>
    </div>
  )
}

