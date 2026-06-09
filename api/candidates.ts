// GET /api/candidates — the shared, server-stored candidates + matches that the
// dashboards hydrate from (so interest registered via the landing page shows up
// for Emil and the company, across devices).

import { dbConfigured, hvals, CAND, MATCH } from './_lib/db'

export const config = { runtime: 'nodejs' }

export default async function handler(_req: any, res: any) {
  if (!dbConfigured()) {
    res.status(200).json({ configured: false, candidates: [], matches: [] })
    return
  }
  try {
    const [candidates, matches] = await Promise.all([hvals(CAND), hvals(MATCH)])
    res.status(200).json({ configured: true, candidates, matches })
  } catch (e) {
    res.status(200).json({ configured: false, candidates: [], matches: [], error: String(e) })
  }
}
