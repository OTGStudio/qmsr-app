import { Menu } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { getInitialsFromEmail } from "@/lib/userDisplay"
import { useAuth } from "@/providers/AuthProvider"
import type { TopBarProps } from "@/types/layout"

import { Sidebar } from "./Sidebar"

export function TopBar({ pageTitle }: TopBarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const email = user?.email ?? ""
  const initials = email ? getInitialsFromEmail(email) : "?"

  async function handleSignOut() {
    try {
      await signOut()
      navigate("/login", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed"
      toast.error(message)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-brand-border bg-brand-card/95 px-4 backdrop-blur supports-backdrop-filter:bg-brand-card/80 md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="min-w-0 flex-1 truncate font-serif text-lg font-semibold text-brand-text md:text-xl">
        {pageTitle}
      </h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-brand-border bg-brand-accent-bg text-brand-accent"
            aria-label="Account menu"
          >
            <span className="text-xs font-semibold">{initials}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuItem asChild>
            <Link to="/app/settings">Account</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault()
              void handleSignOut()
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
