import { AuthForm } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
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

