// /api/company — persist and read company workspaces.
//
//   GET  → admin: every company. company: only their own.
//   POST → upserts the CALLER'S OWN company row (id is forced to the caller's
//          user id, so a company can never write another company's row).
//
// Both require a valid Supabase access token (Authorization: Bearer <token>).
// Backed by Supabase; self-contained so it always bundles on Vercel.

export const config = { runtime: 'nodejs' }

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const sbHeaders = () => ({
  apikey: SB_KEY as string,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
})

async function selectData(query = ''): Promise<any[]> {
  const r = await fetch(`${SB_URL}/rest/v1/companies?select=data${query}`, { headers: sbHeaders() })
  if (!r.ok) throw new Error(`Supabase companies ${r.status}: ${await r.text()}`)
  const rows: { data: any }[] = await r.json()
  return rows.map((x) => x.data).filter(Boolean)
}

async function upsertData(id: string, data: unknown): Promise<void> {
  const r = await fetch(`${SB_URL}/rest/v1/companies`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id, data }),
  })
  if (!r.ok) throw new Error(`Supabase upsert companies ${r.status}: ${await r.text()}`)
}

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
    res.status(200).json({ configured: false, companies: [] })
    return
  }

  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const user = await verifyUser(token)
  if (!user) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }
  const isAdmin = ADMIN_EMAILS.includes(user.email)

  try {
    if (req.method === 'GET') {
      const companies = isAdmin
        ? await selectData()
        : await selectData(`&id=eq.${encodeURIComponent(user.id)}`)
      res.status(200).json({ configured: true, companies })
      return
    }

    if (req.method === 'POST') {
      let body = req.body
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body)
        } catch {
          body = {}
        }
      }
      const company = body?.company ?? body
      if (!company || typeof company !== 'object') {
        res.status(400).json({ ok: false, error: 'Missing company object' })
        return
      }
      // Force the id to the caller's own user id — a company can only write itself.
      const id = isAdmin && typeof company.id === 'string' && company.id ? company.id : user.id
      await upsertData(id, { ...company, id })
      res.status(200).json({ ok: true, id })
      return
    }

    res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
}
