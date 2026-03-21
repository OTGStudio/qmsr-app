import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function Landing() {
  return (
    <div className="flex min-h-svh flex-col bg-brand-bg text-brand-text">
      <header className="border-b border-brand-border bg-brand-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="font-serif text-lg font-semibold tracking-tight text-brand-text">
            QMSR Inspection Readiness
          </span>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="text-brand-muted">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-brand-accent text-white hover:bg-brand-accent/90">
              <Link to="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          CP 7382.850 · QMSR
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
          Prepare for FDA QMSR inspections with structured risk and evidence
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-brand-muted">
          Build device and inspection context, generate a six-area readiness framework, risk thread,
          public FDA signal triangulation, and an Elsa-style inspection narrative — without QSIT-era
          framing.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-brand-accent text-white hover:bg-brand-accent/90">
            <Link to="/signup">Create an account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>

        <ul className="mt-14 space-y-4 border-t border-brand-border pt-10 text-sm leading-relaxed text-brand-muted">
          <li>
            <span className="font-medium text-brand-text">Wizard</span> — Capture facility,
            inspection type, classification, risk, signals, and self-assessment across all six QMS
            areas.
          </li>
          <li>
            <span className="font-medium text-brand-text">Framework and thread</span> — Model 1
            navigation vs Model 2 full coverage, aligned to your scenario.
          </li>
          <li>
            <span className="font-medium text-brand-text">FDA signals</span> — Pull openFDA MDR and
            recall context where your search terms support it.
          </li>
          <li>
            <span className="font-medium text-brand-text">Narrative</span> — Server-generated
            inspection-oriented narrative (authenticated use; session limits apply).
          </li>
        </ul>
      </main>

      <footer className="border-t border-brand-border py-6 text-center text-xs text-brand-muted">
        Educational tooling for quality and regulatory professionals — not legal advice.
      </footer>
    </div>
  )
}
