import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { MissingConfiguration } from '@/components/MissingConfiguration'

import './index.css'

function hasSupabaseEnv(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(typeof url === 'string' && url.trim() && typeof key === 'string' && key.trim())
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

if (!hasSupabaseEnv()) {
  createRoot(rootEl).render(
    <StrictMode>
      <MissingConfiguration />
    </StrictMode>,
  )
} else {
  void import('./bootstrap')
}
