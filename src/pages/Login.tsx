import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { supabase } from '@/lib/supabase'

/** Email + password auth (no OAuth `providers` — Supabase v2 `Provider` is OAuth-only; omitting OAuth shows email form). */
export function Login() {
  return (
    <AuthPageShell title="Sign in">
      <div className="w-full min-w-0">
        <Auth
          supabaseClient={supabase}
          onlyThirdPartyProviders={false}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          view="sign_in"
          showLinks
        />
      </div>
    </AuthPageShell>
  )
}
