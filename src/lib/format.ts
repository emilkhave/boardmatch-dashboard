// Small formatting helpers. Dates are relative to "today" (2026-06-04 in the
// prototype) so the data always feels current during a demo.

export const TODAY = new Date('2026-06-04')

export function initials(name: string): string {
  const parts = name.replace(/^(Dr\.|Professor|Prof\.)\s+/i, '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDays(iso: string | null): string {
  if (!iso) return 'No contact yet'
  const d = new Date(iso)
  const diff = Math.round((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(diff / 30)} month${Math.floor(diff / 30) > 1 ? 's' : ''} ago`
}

// Days since last contact — used to flag stale candidates.
export function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso)
  return Math.round((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}
