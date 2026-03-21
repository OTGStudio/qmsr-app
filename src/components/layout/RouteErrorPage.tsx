import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    console.error('[route error]', error)
  }, [error])

  let title = 'Something went wrong'
  let detail: string | null = null

  if (isRouteErrorResponse(error)) {
    title =
      error.status === 404 ? 'Page not found' : `Error ${String(error.status)}`
    detail = error.statusText || null
  } else if (error instanceof Error) {
    detail = error.message
  } else {
    detail = 'An unexpected error occurred while loading this page.'
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-brand-bg px-6 py-12 text-center text-brand-text">
      <h1 className="font-serif text-2xl font-semibold">{title}</h1>
      {detail ? (
        <p className="max-w-md text-sm leading-relaxed text-brand-muted">
          {detail}
        </p>
      ) : null}
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </main>
  )
}
