// ---------------------------------------------------------------------------
// Tiny persistence layer over Upstash Redis (REST) — SERVER-SIDE ONLY.
// Works with either Upstash-native env vars or Vercel KV env vars:
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//   KV_REST_API_URL        / KV_REST_API_TOKEN
// Candidates and matches are stored as JSON in two Redis hashes.
// ---------------------------------------------------------------------------

const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

export const CAND = 'bm:candidates'
export const MATCH = 'bm:matches'

export function dbConfigured(): boolean {
  return Boolean(URL && TOKEN)
}

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

export async function hsetJSON(hash: string, field: string, obj: unknown): Promise<void> {
  await cmd(['HSET', hash, field, JSON.stringify(obj)])
}

export async function hvals<T = any>(hash: string): Promise<T[]> {
  const res: string[] = (await cmd(['HVALS', hash])) || []
  return res
    .map((s) => {
      try {
        return JSON.parse(s) as T
      } catch {
        return null
      }
    })
    .filter(Boolean) as T[]
}
