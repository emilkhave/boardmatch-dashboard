// GET /api/candidates — the shared, server-stored candidates + matches that the
// dashboards hydrate from. Backed by Supabase (Postgres) via its REST API.
// Self-contained (no shared imports) so the function always bundles on Vercel.

export const config = { runtime: 'nodejs' }

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

async function selectData(table: string): Promise<any[]> {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?select=data`, {
    headers: { apikey: SB_KEY as string, Authorization: `Bearer ${SB_KEY}` },
  })
  if (!r.ok) throw new Error(`Supabase ${table} ${r.status}: ${await r.text()}`)
  const rows: { data: any }[] = await r.json()
  return rows.map((x) => x.data).filter(Boolean)
}

export default async function handler(_req: any, res: any) {
  if (!SB_URL || !SB_KEY) {
    res.status(200).json({ configured: false, candidates: [], matches: [] })
    return
  }
  try {
    const [candidates, matches] = await Promise.all([selectData('candidates'), selectData('matches')])
    res.status(200).json({ configured: true, candidates, matches })
  } catch (e) {
    res.status(200).json({ configured: false, candidates: [], matches: [], error: String(e) })
  }
}
