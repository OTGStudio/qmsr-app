import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

import { supabase } from '@/lib/supabase'

export function Signup() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 p-8">
      <h1 className="text-center font-serif text-2xl text-brand-text">Signup</h1>
      <Auth
        supabaseClient={supabase}
        onlyThirdPartyProviders={false}
        appearance={{ theme: ThemeSupa }}
        theme="default"
        view="sign_up"
        showLinks
      />
    </main>
  )
}
