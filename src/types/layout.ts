export interface SidebarProps {
  /** Called after a nav action (e.g. close mobile drawer). */
  onNavigate?: () => void
  className?: string
}

export interface TopBarProps {
  pageTitle: string
}
