import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/components/layout/RequireAuth'
import { AuthProvider } from '@/providers/AuthProvider'
import { AccountSettings } from '@/pages/AccountSettings'
import { Dashboard } from '@/pages/Dashboard'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { ScenarioDetail } from '@/pages/ScenarioDetail'
import { Signup } from '@/pages/Signup'
import { WizardShell } from '@/pages/WizardShell'
import { WorkspaceSettings } from '@/pages/WorkspaceSettings'

import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app" element={<RequireAuth />}>
              <Route index element={<Dashboard />} />
              <Route path="new" element={<WizardShell />} />
              <Route path="s/:id" element={<ScenarioDetail />} />
              <Route path="workspace" element={<WorkspaceSettings />} />
              <Route path="settings" element={<AccountSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
