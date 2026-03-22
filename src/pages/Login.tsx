import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

/** Email + password auth (replaces @supabase/auth-ui-react — that package bundles a second React and breaks hooks under React 19). */
export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      navigate(redirect, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell title="Sign in">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="login-email"
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
          <label htmlFor="login-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value)
            }}
            required
            disabled={submitting}
            className="border-brand-border"
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        No account?{' '}
        <Link
          to="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthPageShell>
  )
}
