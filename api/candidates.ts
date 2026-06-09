// GET /api/candidates — the shared, server-stored candidates + matches that the
// dashboards hydrate from. Self-contained (no shared imports) so the function
// always bundles correctly on Vercel.

export const config = { runtime: 'nodejs' }

const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

async function cmd(args: (string | number)[]): Promise<any> {
  const r = await fetch(URL as string, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const j: any = await r.json()
  if (j && j.error) throw new Error('Redis error: ' + j.error)
  return j ? j.result : null
}

async function hvals(hash: string): Promise<any[]> {
  const res: string[] = (await cmd(['HVALS', hash])) || []
  return res
    .map((s) => {
      try {
        return JSON.parse(s)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

export default async function handler(_req: any, res: any) {
  if (!URL || !TOKEN) {
    res.status(200).json({ configured: false, candidates: [], matches: [] })
    return
  }
  try {
    const [candidates, matches] = await Promise.all([hvals('bm:candidates'), hvals('bm:matches')])
    res.status(200).json({ configured: true, candidates, matches })
  } catch (e) {
    res.status(200).json({ configured: false, candidates: [], matches: [], error: String(e) })
  }
}
