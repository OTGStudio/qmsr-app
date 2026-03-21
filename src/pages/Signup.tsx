import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { supabase } from '@/lib/supabase'

export function Signup() {
  return (
    <AuthPageShell title="Create account">
      <div className="w-full min-w-0">
        <Auth
          supabaseClient={supabase}
          onlyThirdPartyProviders={false}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          view="sign_up"
          showLinks
        />
      </div>
    </AuthPageShell>
  )
}
