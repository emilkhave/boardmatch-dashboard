// GET /api/candidates — the server-stored candidates + matches the dashboards
// hydrate from. Backed by Supabase (Postgres) via its REST API.
//
// Multi-tenant safe: the caller must send their Supabase access token
// (Authorization: Bearer <token>). We verify it server-side and then:
//   • admin (email in ADMIN_EMAILS) → all candidates + matches
//   • company                       → ONLY their own matches + the candidates
//                                     those matches reference
//   • no/invalid token              → configured, but no data
// This prevents one company's browser from ever receiving another company's data.
//
// Self-contained (no shared imports) so the function always bundles on Vercel.

export const config = { runtime: 'nodejs' }

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

// Server-side admin allowlist (comma-separated emails). Kept separate from the
// client's VITE_ADMIN_EMAILS because build-time VITE_* vars aren't readable here.
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const sbHeaders = () => ({ apikey: SB_KEY as string, Authorization: `Bearer ${SB_KEY}` })

async function selectData(table: string, query = ''): Promise<any[]> {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?select=data${query}`, { headers: sbHeaders() })
  if (!r.ok) throw new Error(`Supabase ${table} ${r.status}: ${await r.text()}`)
  const rows: { data: any }[] = await r.json()
  return rows.map((x) => x.data).filter(Boolean)
}

// Verify the caller's Supabase access token → { id, email } or null.
async function verifyUser(token: string): Promise<{ id: string; email: string } | null> {
  if (!token) return null
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_KEY as string, Authorization: `Bearer ${token}` },
    })
    if (!r.ok) return null
    const u: any = await r.json()
    return u?.id ? { id: u.id, email: String(u.email || '').toLowerCase() } : null
  } catch {
    return null
  }
}

export default async function handler(req: any, res: any) {
  if (!SB_URL || !SB_KEY) {
    res.status(200).json({ configured: false, candidates: [], matches: [] })
    return
  }
  try {
    const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const user = await verifyUser(token)

    // Anonymous / invalid session → configured but empty. The browser only calls
    // this while logged in, so this just denies data to unauthenticated callers.
    if (!user) {
      res.status(200).json({ configured: true, candidates: [], matches: [] })
      return
    }

    // Admin sees everything.
    if (ADMIN_EMAILS.includes(user.email)) {
      const [candidates, matches] = await Promise.all([
        selectData('candidates'),
        selectData('matches'),
      ])
      res.status(200).json({ configured: true, candidates, matches })
      return
    }

    // Company sees only their own pipeline. A company's id is its Supabase user id,
    // which is what interest.ts stores as a match's companyId (the schema exposes
    // it as the generated column `company_id`).
    const matches = await selectData(
      'matches',
      `&company_id=eq.${encodeURIComponent(user.id)}`,
    )
    const candidateIds = [...new Set(matches.map((m) => m.candidateId).filter(Boolean))]
    let candidates: any[] = []
    if (candidateIds.length) {
      const inList = candidateIds.map((id) => `"${id}"`).join(',')
      candidates = await selectData('candidates', `&id=in.(${inList})`)
    }
    res.status(200).json({ configured: true, candidates, matches })
  } catch (e) {
    res.status(200).json({ configured: false, candidates: [], matches: [], error: String(e) })
  }
}
