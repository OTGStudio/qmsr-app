/** Derives two-letter initials from an email local-part for avatar display. */
export function getInitialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? ""
  const parts = local.split(/[._-]+/).filter((p) => p.length > 0)
  if (parts.length >= 2) {
    const a = parts[0]?.charAt(0) ?? ""
    const b = parts[1]?.charAt(0) ?? ""
    return (a + b).toUpperCase()
  }
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase()
  }
  if (local.length === 1) {
    return local.toUpperCase()
  }
  return "?"
}
