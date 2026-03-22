import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthPageShellProps {
  title: string
  children: ReactNode
}

/**
 * Full-viewport auth layout: full-width background, readable form width, no centered #root column.
 */
export function AuthPageShell({ title, children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-brand-bg text-brand-text">
      <header className="shrink-0 border-b border-brand-border bg-brand-card/90 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="text-sm font-medium text-brand-accent underline-offset-4 hover:underline"
        >
          ← Back to home
        </Link>
      </header>
      <div className="flex flex-1 flex-col justify-start px-4 py-10 sm:justify-center sm:py-12">
        <div className="mx-auto w-full max-w-md">
          <Card className="w-full border-brand-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-left font-serif text-2xl font-semibold text-card-foreground">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-left text-card-foreground [&_a]:text-primary">
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
