import { useCallback, useEffect, useState } from 'react'
import type { InterestInput } from './store'

// ---------------------------------------------------------------------------
// Zoho integration (prototype scaffold).
//
// PRODUCTION DESIGN (not yet wired — requires the serverless backend):
//   • Auth:     Zoho OAuth 2.0 (self-client). Store refresh token server-side only.
//   • Read:     Zoho CRM REST API v2 — GET /crm/v2/{module} (Leads | Contacts) or
//               Zoho Recruit /recruit/v2/Candidates — to pull candidate records.
//   • Realtime: Zoho Notifications/Webhook API → POST to our endpoint
//               (ZOHO_WEBHOOK_PATH) whenever a record is created/updated.
//   • Write-back: on pipeline stage changes, PUT the record in Zoho so the CRM
//               stays in sync (two-way).
//
// In this prototype the config is stored locally and the "sync" uses sample
// records, so the landing-page → pipeline flow can be demoed end-to-end today.
// ---------------------------------------------------------------------------

export const ZOHO_WEBHOOK_PATH = '/api/zoho/webhook'

export type ZohoDataCenter = 'com' | 'eu' | 'in' | 'com.au' | 'jp'
export type ZohoModule = 'Leads' | 'Contacts' | 'Candidates'

export interface ZohoConfig {
  connected: boolean
  dataCenter: ZohoDataCenter
  module: ZohoModule
  clientId: string
  orgId: string
  lastSyncedAt: string | null
}

const STORAGE_KEY = 'boardmatch.zoho.v1'

const DEFAULT_CONFIG: ZohoConfig = {
  connected: false,
  dataCenter: 'eu',
  module: 'Leads',
  clientId: '',
  orgId: '',
  lastSyncedAt: null,
}

export function useZohoConfig() {
  const [config, setConfig] = useState<ZohoConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ZohoConfig>) }
    } catch {
      /* ignore */
    }
    return DEFAULT_CONFIG
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      /* ignore */
    }
  }, [config])

  const update = useCallback((patch: Partial<ZohoConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  return { config, update }
}

// Sample records as they would arrive from a Zoho module, each tagged with the
// board (company) the candidate is interested in. Used by the demo sync.
export const MOCK_ZOHO_CANDIDATES: InterestInput[] = [
  {
    companyId: 'c-helix',
    name: 'Pernille Holm',
    title: 'Former CFO, Trustpilot',
    email: 'pernille.holm@zoho-demo.com',
    location: 'Copenhagen, Denmark',
    linkedin: 'linkedin.com/in/pernilleholm',
    competencies: ['SaaS / Technology', 'IPO / Capital Markets', 'Financial Reporting'],
    message: 'Imported from Zoho — strong SaaS finance profile.',
    source: 'zoho',
  },
  {
    companyId: 'c-nordlys',
    name: 'Lars-Erik Movin',
    title: 'Independent Energy Advisor',
    email: 'lars.movin@zoho-demo.com',
    location: 'Aarhus, Denmark',
    linkedin: 'linkedin.com/in/larsmovin',
    competencies: ['Energy & Utilities', 'ESG & Sustainability'],
    message: 'Imported from Zoho — offshore wind background.',
    source: 'zoho',
  },
  {
    companyId: 'c-saga',
    name: 'Dr. Yasmin Patel',
    title: 'Regulatory Affairs Lead, Novozymes',
    email: 'yasmin.patel@zoho-demo.com',
    location: 'Copenhagen, Denmark',
    linkedin: 'linkedin.com/in/yasminpatel',
    competencies: ['Regulatory Affairs', 'Pharma / Biotech', 'Clinical Development'],
    message: 'Imported from Zoho — regulatory specialist.',
    source: 'zoho',
  },
]
