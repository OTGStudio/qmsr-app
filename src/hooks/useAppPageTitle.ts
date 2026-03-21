import { useLocation } from "react-router-dom"

/** Top bar title for the current authenticated app route. */
export function useAppPageTitle(): string {
  const location = useLocation()

  if (/^\/app\/s\/[^/]+/.test(location.pathname)) {
    return "Scenario"
  }
  if (location.pathname.startsWith("/app/new")) {
    return "New scenario"
  }
  if (location.pathname.startsWith("/app/workspace")) {
    return "Workspace"
  }
  if (location.pathname.startsWith("/app/settings")) {
    return "Account"
  }
  return "Dashboard"
}
