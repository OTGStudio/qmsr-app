import { Outlet } from "react-router-dom"

import { useAppPageTitle } from "@/hooks/useAppPageTitle"

import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

export function AppShell() {
  const pageTitle = useAppPageTitle()

  return (
    <div className="flex min-h-svh bg-brand-bg">
      <aside
        className="hidden w-64 shrink-0 border-r border-brand-border bg-brand-card md:flex md:flex-col"
        aria-label="Application"
      >
        <Sidebar />
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <TopBar pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
