import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { RouteErrorPage } from '@/components/layout/RouteErrorPage'
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Landing /> },
      {
        path: 'login',
        element: (
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        ),
      },
      {
        path: 'signup',
        element: (
          <AuthRedirect>
            <Signup />
          </AuthRedirect>
        ),
      },
      {
        path: 'app',
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'new', element: <WizardShell /> },
              {
                path: 's/:id',
                element: <ScenarioDetail />,
                children: [
                  { index: true, element: <FrameworkView /> },
                  { path: 'thread', element: <ThreadView /> },
                  { path: 'signals', element: <SignalsView /> },
                  { path: 'narrative', element: <NarrativeView /> },
                  { path: 'export', element: <ExportView /> },
                ],
              },
              { path: 'workspace', element: <WorkspaceSettings /> },
              { path: 'settings', element: <AccountSettings /> },
            ],
          },
        ],
      },
    ],
  },
])

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-center" />
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
