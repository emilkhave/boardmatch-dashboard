// POST /api/interest — a candidate clicked "I'm interested" on a landing page.
// Flow: validate {firstName,lastName,email,companyId} → look the person up in Zoho
// by email (pulling their REAL data) → upsert candidate + an "Interested" match
// into the shared store → both dashboards read it from /api/candidates.

import { zohoConfigured, findRecordByEmail, mapZohoRecord } from './_lib/zoho'
import { dbConfigured, hsetJSON, hvals, CAND, MATCH } from './_lib/db'

export const config = { runtime: 'nodejs' }

const today = () => new Date().toISOString().slice(0, 10)
const PALETTE = ['#27534b', '#3a8073', '#549b8e', '#2d675c', '#1c3833', '#434a55', '#21433d']
function pickColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
const uid = (p: string) => `${p}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`

function nonEmpty(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  const firstName = (body?.firstName || '').trim()
  const lastName = (body?.lastName || '').trim()
  const email = (body?.email || '').trim()
  const companyId = (body?.companyId || '').trim()
  const message = (body?.message || '').trim()

  if (!firstName || !email || !companyId) {
    res.status(400).json({ ok: false, error: 'firstName, email and companyId are required' })
    return
  }

  // No database yet → tell the client to fall back to its local store.
  if (!dbConfigured()) {
    res.status(200).json({ ok: false, configured: false })
    return
  }

  // 1) Pull the person's REAL data from Zoho (by email).
  let zoho: ReturnType<typeof mapZohoRecord> | null = null
  let matchedInZoho = false
  if (zohoConfigured()) {
    try {
      const rec = await findRecordByEmail(email)
      if (rec) {
        zoho = mapZohoRecord(rec)
        matchedInZoho = true
      }
    } catch (e) {
      console.error('Zoho lookup failed:', e)
    }
  }

  // 2) Upsert the candidate (reuse by email).
  const candidates = await hvals<any>(CAND)
  const matches = await hvals<any>(MATCH)
  let candidate = candidates.find((c) => c.email?.toLowerCase() === email.toLowerCase())
  const isNew = !candidate

  if (!candidate) {
    candidate = {
      id: uid('p'),
      name: zoho?.name || `${firstName} ${lastName}`.trim(),
      title: zoho?.title || 'Board candidate',
      location: zoho?.location || '—',
      experienceYears: 0,
      bio: zoho?.bio || message || 'Expressed interest via the landing page.',
      competencies: zoho?.competencies || [],
      sectors: zoho?.sectors || [],
      boardExperience: zoho?.boardExperience || 'To be added.',
      currentBoards: 0,
      availability: 'Available',
      email,
      phone: zoho?.phone || '',
      linkedin: zoho?.linkedin || '',
      avatarColor: pickColor(email),
      createdAt: today(),
    }
    await hsetJSON(CAND, candidate.id, candidate)
  } else if (zoho) {
    // Enrich an existing candidate with any real Zoho fields.
    candidate = { ...candidate, ...nonEmpty(zoho) }
    await hsetJSON(CAND, candidate.id, candidate)
  }

  // 3) Upsert the match into the Interested stage.
  let match = matches.find((m) => m.companyId === companyId && m.candidateId === candidate.id)
  if (!match) {
    match = {
      id: uid('m'),
      companyId,
      candidateId: candidate.id,
      stage: 'interested',
      matchScore: 70,
      lastContact: today(),
      nextStep: 'Review new interest',
      notes: message || `Self-reported interest${matchedInZoho ? ' — matched in Zoho' : ''}.`,
      history: [
        {
          id: uid('act'),
          date: today(),
          type: 'created',
          text: `Expressed interest via the landing page${matchedInZoho ? ' — matched in Zoho' : ''}.`,
          author: candidate.name,
        },
      ],
    }
    await hsetJSON(MATCH, match.id, match)
  }

  res.status(200).json({ ok: true, configured: true, matchedInZoho, isNew, candidate, match })
}
