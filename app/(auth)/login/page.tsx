import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components/auth/auth-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  } catch (error: any) {
    // Log error for debugging but don't crash the page
    console.error('Error checking user session:', error)
    // Continue to show login form even if there's an error
  }

  async function handleLogin(email: string, password: string) {
    'use server'
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AuthForm mode="login" onSubmit={handleLogin} />
    </div>
  )
}

