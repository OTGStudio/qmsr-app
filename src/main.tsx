import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { Toaster } from '@/components/ui/sonner'
import { WizardShell } from '@/components/wizard/WizardShell'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'
import { AccountSettings } from '@/pages/AccountSettings'
import { Dashboard } from '@/pages/Dashboard'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { ExportView } from '@/components/export/ExportView'
import { FrameworkView } from '@/components/framework/FrameworkView'
import { NarrativeView } from '@/components/narrative/NarrativeView'
import { SignalsView } from '@/components/signals/SignalsView'
import { ThreadView } from '@/components/thread/ThreadView'
import { ScenarioDetail } from '@/pages/ScenarioDetail'
import { Signup } from '@/pages/Signup'
import { WorkspaceSettings } from '@/pages/WorkspaceSettings'

import './index.css'

const queryClient = new QueryClient()

function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/app'

  useEffect(() => {
    if (!loading && user) {
      navigate(redirect, { replace: true })
    }
  }, [user, loading, navigate, redirect])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRedirect>
                  <Signup />
                </AuthRedirect>
              }
            />
            <Route path="/app" element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="new" element={<WizardShell />} />
                <Route path="s/:id" element={<ScenarioDetail />}>
                  <Route index element={<FrameworkView />} />
                  <Route path="thread" element={<ThreadView />} />
                  <Route path="signals" element={<SignalsView />} />
                  <Route path="narrative" element={<NarrativeView />} />
                  <Route path="export" element={<ExportView />} />
                </Route>
                <Route path="workspace" element={<WorkspaceSettings />} />
                <Route path="settings" element={<AccountSettings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
