import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function Dashboard() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold text-brand-text md:text-3xl">
          Your scenarios
        </h1>
        <Button asChild className="bg-brand-accent text-white hover:bg-brand-accent/90">
          <Link to="/app/new">New scenario</Link>
        </Button>
      </div>

      <div
        className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-brand-border bg-brand-card px-6 py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-brand-muted">No scenarios yet</p>
        <p className="mt-2 max-w-sm text-sm text-brand-muted">
          Create a scenario from the wizard to generate your inspection readiness
          framework.
        </p>
        <Button asChild className="mt-6 bg-brand-accent text-white hover:bg-brand-accent/90">
          <Link to="/app/new">New scenario</Link>
        </Button>
      </div>
    </div>
  )
}
