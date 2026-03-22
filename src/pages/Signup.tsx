import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

/** Email + password sign-up (replaces @supabase/auth-ui-react — avoids duplicate React / broken hooks). */
export function Signup() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      const origin = window.location.origin
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/app`,
        },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      if (data.session) {
        navigate('/app', { replace: true })
        return
      }
      toast.success(
        'Check your email for a confirmation link before signing in.',
        { duration: 8000 },
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell title="Create account">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value)
            }}
            required
            disabled={submitting}
            className="border-brand-border"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value)
            }}
            required
            minLength={6}
            disabled={submitting}
            className="border-brand-border"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="signup-confirm-password"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <Input
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(ev) => {
              setConfirmPassword(ev.target.value)
            }}
            required
            minLength={6}
            disabled={submitting}
            className="border-brand-border"
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}
