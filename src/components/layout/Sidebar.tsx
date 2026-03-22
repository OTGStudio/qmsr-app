import { Home, LogOut, PlusCircle } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/AuthProvider"
import type { SidebarProps } from "@/types/layout"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isActive
      ? "bg-brand-accent-bg font-semibold text-brand-text"
      : "text-brand-text hover:bg-brand-card-alt"
  )

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const email = user?.email ?? ""

  async function handleSignOut() {
    try {
      await signOut()
      navigate("/login", { replace: true })
      onNavigate?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed"
      toast.error(message)
    }
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-brand-card text-brand-text",
        className
      )}
    >
      <div className="border-b border-brand-border px-4 py-5">
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-brand-muted">
          Respress Solutions LLC
        </p>
        <p className="font-serif text-xl font-semibold tracking-tight text-brand-text">
          QMSR
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        <NavLink
          to="/app/"
          end
          className={navLinkClass}
          onClick={() => {
            onNavigate?.()
          }}
        >
          <Home className="size-4 shrink-0" aria-hidden />
          Dashboard
        </NavLink>
        <NavLink
          to="/app/new"
          className={navLinkClass}
          onClick={() => {
            onNavigate?.()
          }}
        >
          <PlusCircle className="size-4 shrink-0" aria-hidden />
          New scenario
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-brand-border p-3">
        <div className="mb-3 rounded-lg border border-dashed border-brand-border bg-brand-bg px-3 py-2">
          <p className="text-xs font-medium text-brand-muted">Workspace</p>
          <p className="text-sm text-brand-text">Personal</p>
        </div>
        <p className="mb-2 truncate text-xs text-brand-muted" title={email}>
          {email || "Signed in"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2 border-brand-border"
          onClick={() => {
            void handleSignOut()
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  )
}
