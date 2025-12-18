import { AuthForm } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  async function handleSignup(email: string, password: string) {
    'use server'
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AuthForm mode="signup" onSubmit={handleSignup} />
    </div>
  )
}

