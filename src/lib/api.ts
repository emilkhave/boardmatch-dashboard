import type { Candidate, Match } from '../types'

// Thin client for the serverless API. Everything degrades gracefully: if the
// backend isn't configured yet, these return "not configured" and the app falls
// back to its local store.

export interface InterestPayload {
  firstName: string
  lastName: string
  email: string
  companyId: string
  message?: string
}

export interface InterestResponse {
  ok: boolean
  configured: boolean
  matchedInZoho?: boolean
  isNew?: boolean
  candidate?: Candidate
  match?: Match
}

export async function postInterest(input: InterestPayload): Promise<InterestResponse> {
  try {
    const r = await fetch('/api/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return (await r.json()) as InterestResponse
  } catch {
    return { ok: false, configured: false }
  }
}

export interface ServerData {
  configured: boolean
  candidates: Candidate[]
  matches: Match[]
}

export async function fetchServerData(accessToken?: string | null): Promise<ServerData | null> {
  try {
    const r = await fetch('/api/candidates', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
    if (!r.ok) return null
    const j = (await r.json()) as ServerData
    return j.configured ? j : null
  } catch {
    return null
  }
}

export interface BrandResult {
  ok: boolean
  domain: string
  logoUrl: string
  brandColor: string
}

export async function fetchBrand(domain: string): Promise<BrandResult | null> {
  try {
    const r = await fetch(`/api/brand?domain=${encodeURIComponent(domain)}`)
    if (!r.ok) return null
    const j = (await r.json()) as BrandResult
    return j.ok ? j : null
  } catch {
    return null
  }
}
