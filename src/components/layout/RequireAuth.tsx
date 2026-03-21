import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/providers/AuthProvider'

export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="flex min-h-svh flex-col items-center justify-center gap-2 bg-brand-bg"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2
          className="h-8 w-8 animate-spin text-brand-accent"
          aria-hidden
        />
        <span className="sr-only">Loading session</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
