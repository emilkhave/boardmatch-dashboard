import { useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { supabase } from '../lib/supabase'
import { primaryLogoUrl } from '../lib/brand'
import { persistCompany } from '../lib/api'
import type { Company } from '../types'

// When a company user is signed in, make sure their company workspace exists in
// the store (built from their account metadata) AND is persisted server-side so
// the admin sees every signed-up client. Runs once per session.
export function SessionBootstrap() {
  const { session, configured, accessToken } = useAuth()
  const { getCompany, upsertCompany } = useData()

  useEffect(() => {
    if (!configured || !supabase) return
    if (session?.role !== 'company' || !session.companyId) return
    if (getCompany(session.companyId)) return

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      const m = user.user_metadata ?? {}
      const brand = m.brandColor || '#27534b'
      const company: Company = {
        id: user.id,
        name: m.companyName || session.name,
        logoColor: brand,
        brandColor: brand,
        logoUrl: m.logoUrl || primaryLogoUrl(m.website),
        industry: m.industry || 'Not specified',
        location: m.location || '—',
        size: '—',
        revenue: '—',
        founded: new Date().getFullYear(),
        website: m.website || '',
        description: 'Company profile — complete it in Settings.',
        seatTitle: m.seatTitle || 'Board Member',
        seatType: 'Board Member',
        seatsOpen: 1,
        compensation: '—',
        requiredCompetencies: [],
        contactName: m.name || session.name,
        contactRole: m.role_title || 'Primary contact',
        contactEmail: session.email,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      upsertCompany(company)
      // Persist so it shows up in the admin's directory. Fire-and-forget.
      void persistCompany(company, accessToken)
    })
  }, [session, configured, accessToken, getCompany, upsertCompany])

  return null
}
