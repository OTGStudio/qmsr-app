/**
 * Shown when Vite env is missing Supabase keys (e.g. Vercel env not set or not redeployed).
 * Does not import @/lib/supabase.
 */
export function MissingConfiguration() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-brand-bg px-6 py-12 text-center text-brand-text">
      <h1 className="font-serif text-2xl font-semibold">Configuration required</h1>
      <p className="max-w-md text-sm leading-relaxed text-brand-muted">
        This app needs{' '}
        <code className="rounded border border-brand-border bg-brand-card px-1.5 py-0.5 text-xs">
          VITE_SUPABASE_URL
        </code>{' '}
        and{' '}
        <code className="rounded border border-brand-border bg-brand-card px-1.5 py-0.5 text-xs">
          VITE_SUPABASE_ANON_KEY
        </code>{' '}
        at build time. Add them in your host (e.g. Vercel → Project → Settings → Environment
        Variables), then redeploy.
      </p>
    </main>
  )
}
