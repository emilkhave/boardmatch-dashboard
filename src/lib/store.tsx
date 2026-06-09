import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Candidate, Company, Match, MatchActivity, PipelineStage } from '../types'
import { PIPELINE_STAGES } from '../types'
import { mockCandidates } from '../data/mockCandidates'
import { mockCompanies } from '../data/mockCompanies'
import { mockMatches } from '../data/mockMatches'
import { TODAY_ISO } from './format'

// ---------------------------------------------------------------------------
// A lightweight in-memory store for the mutable parts of the prototype —
// companies, candidates and the pipeline matches. Seeded from the mock data and
// persisted to localStorage so moves and edits survive a refresh during a demo.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'boardmatch.data.v3'

interface StoredData {
  companies: Company[]
  candidates: Candidate[]
  matches: Match[]
}

interface DataContextValue {
  companies: Company[]
  candidates: Candidate[]
  matches: Match[]
  getCompany: (id: string) => Company | undefined
  getCandidate: (id: string) => Candidate | undefined
  matchesForCompany: (companyId: string) => Match[]
  matchesForCandidate: (candidateId: string) => Match[]
  moveMatch: (matchId: string, stage: PipelineStage, author?: string) => void
  updateMatch: (matchId: string, patch: Partial<Match>) => void
  updateCandidate: (candidateId: string, patch: Partial<Candidate>) => void
  updateCompany: (companyId: string, patch: Partial<Company>) => void
  /** Create a new company (self-service sign-up). Returns the new id. */
  addCompany: (input: CompanyInput) => string
  /** Register candidate interest (landing page / Zoho) → adds them to the pipeline. */
  addInterest: (input: InterestInput) => { candidateId: string; matchId: string; isNew: boolean }
  resetData: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

function seed(): StoredData {
  // Deep clone so we never mutate the imported mock arrays.
  return {
    companies: structuredClone(mockCompanies),
    candidates: structuredClone(mockCandidates),
    matches: structuredClone(mockMatches),
  }
}

function readStored(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredData
  } catch {
    /* fall through to seed */
  }
  return seed()
}

const stageLabel = (stage: PipelineStage) =>
  PIPELINE_STAGES.find((s) => s.id === stage)?.label ?? stage

let activityCounter = 0
function newActivityId() {
  activityCounter += 1
  return `act-${TODAY_ISO}-${activityCounter}`
}

// Browser-safe unique id (crypto.randomUUID where available).
function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rand}`
}

const AVATAR_PALETTE = ['#27534b', '#3a8073', '#549b8e', '#2d675c', '#1c3833', '#434a55', '#21433d']
function pickColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

// Input captured from the public landing page or a Zoho sync.
export interface InterestInput {
  companyId: string
  name: string
  title: string
  email: string
  linkedin?: string
  location?: string
  competencies?: string[]
  message?: string
  source?: 'landing' | 'zoho'
}

// Input for self-service company sign-up.
export interface CompanyInput {
  name: string
  website?: string
  industry?: string
  location?: string
  seatTitle?: string
  contactName: string
  contactRole?: string
  contactEmail: string
  brandColor?: string
  logoUrl?: string
}

function buildCompany(input: CompanyInput): Company {
  const brand = input.brandColor || pickColor(input.name)
  return {
    id: newId('c'),
    name: input.name.trim(),
    logoColor: brand,
    brandColor: brand,
    logoUrl: input.logoUrl,
    industry: input.industry?.trim() || 'Not specified',
    location: input.location?.trim() || '—',
    size: '—',
    revenue: '—',
    founded: new Date().getFullYear(),
    website: input.website?.trim() || '',
    description: 'Company profile to be completed in Settings.',
    seatTitle: input.seatTitle?.trim() || 'Board Member',
    seatType: 'Board Member',
    seatsOpen: 1,
    compensation: '—',
    requiredCompetencies: [],
    contactName: input.contactName.trim(),
    contactRole: input.contactRole?.trim() || 'Primary contact',
    contactEmail: input.contactEmail.trim(),
    status: 'active',
    createdAt: TODAY_ISO,
  }
}

function buildCandidate(input: InterestInput): Candidate {
  return {
    id: newId('p'),
    name: input.name.trim(),
    title: input.title.trim() || 'Board candidate',
    location: input.location?.trim() || '—',
    experienceYears: 0,
    bio:
      input.message?.trim() ||
      `New candidate — expressed interest via ${input.source === 'zoho' ? 'Zoho' : 'the landing page'}. Profile to be enriched.`,
    competencies: input.competencies ?? [],
    sectors: [],
    boardExperience: 'To be added.',
    currentBoards: 0,
    availability: 'Available',
    email: input.email.trim(),
    phone: '',
    linkedin: input.linkedin?.trim() || '',
    avatarColor: pickColor(input.name),
    createdAt: TODAY_ISO,
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* ignore quota / private-mode errors in the prototype */
    }
  }, [data])

  const getCompany = useCallback(
    (id: string) => data.companies.find((c) => c.id === id),
    [data.companies],
  )

  const getCandidate = useCallback(
    (id: string) => data.candidates.find((c) => c.id === id),
    [data.candidates],
  )

  const matchesForCompany = useCallback(
    (companyId: string) => data.matches.filter((m) => m.companyId === companyId),
    [data.matches],
  )

  const matchesForCandidate = useCallback(
    (candidateId: string) => data.matches.filter((m) => m.candidateId === candidateId),
    [data.matches],
  )

  const moveMatch = useCallback((matchId: string, stage: PipelineStage, author = 'Emil') => {
    setData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => {
        if (m.id !== matchId || m.stage === stage) return m
        const entry: MatchActivity = {
          id: newActivityId(),
          date: TODAY_ISO,
          type: 'stage_change',
          text: `Moved to ${stageLabel(stage)}.`,
          author,
        }
        return { ...m, stage, lastContact: TODAY_ISO, history: [...m.history, entry] }
      }),
    }))
  }, [])

  const updateMatch = useCallback((matchId: string, patch: Partial<Match>) => {
    setData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => (m.id === matchId ? { ...m, ...patch } : m)),
    }))
  }, [])

  const updateCandidate = useCallback((candidateId: string, patch: Partial<Candidate>) => {
    setData((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) => (c.id === candidateId ? { ...c, ...patch } : c)),
    }))
  }, [])

  const updateCompany = useCallback((companyId: string, patch: Partial<Company>) => {
    setData((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => (c.id === companyId ? { ...c, ...patch } : c)),
    }))
  }, [])

  const addCompany = useCallback((input: CompanyInput) => {
    const company = buildCompany(input)
    setData((prev) => ({ ...prev, companies: [company, ...prev.companies] }))
    return company.id
  }, [])

  const addInterest = useCallback(
    (input: InterestInput) => {
      const sourceLabel = input.source === 'zoho' ? 'Zoho' : 'the landing page'

      // Reuse an existing candidate with the same email, else create one.
      const existingCandidate = data.candidates.find(
        (c) => c.email.toLowerCase() === input.email.trim().toLowerCase(),
      )
      const candidate = existingCandidate ?? buildCandidate(input)
      const isNew = !existingCandidate

      const existingMatch = data.matches.find(
        (m) => m.companyId === input.companyId && m.candidateId === candidate.id,
      )
      const newMatchId = existingMatch ? existingMatch.id : newId('m')

      const interestEntry: MatchActivity = {
        id: newActivityId(),
        date: TODAY_ISO,
        type: existingMatch ? 'note' : 'created',
        text: `Expressed interest via ${sourceLabel}.`,
        author: candidate.name,
      }

      setData((prev) => {
        const candidates = isNew ? [candidate, ...prev.candidates] : prev.candidates
        let matches: Match[]
        if (existingMatch) {
          matches = prev.matches.map((m) =>
            m.id === existingMatch.id
              ? {
                  ...m,
                  stage: m.stage === 'not_relevant' ? 'interested' : m.stage,
                  lastContact: TODAY_ISO,
                  history: [...m.history, interestEntry],
                }
              : m,
          )
        } else {
          const match: Match = {
            id: newMatchId,
            companyId: input.companyId,
            candidateId: candidate.id,
            stage: 'interested',
            matchScore: 70,
            lastContact: TODAY_ISO,
            nextStep: 'Review new interest & enrich profile',
            notes: input.message?.trim() || `Self-reported interest via ${sourceLabel}.`,
            history: [interestEntry],
          }
          matches = [match, ...prev.matches]
        }
        return { ...prev, candidates, matches }
      })

      return { candidateId: candidate.id, matchId: newMatchId, isNew }
    },
    [data],
  )

  const resetData = useCallback(() => setData(seed()), [])

  const value = useMemo<DataContextValue>(
    () => ({
      companies: data.companies,
      candidates: data.candidates,
      matches: data.matches,
      getCompany,
      getCandidate,
      matchesForCompany,
      matchesForCandidate,
      moveMatch,
      updateMatch,
      updateCandidate,
      updateCompany,
      addCompany,
      addInterest,
      resetData,
    }),
    [
      data,
      getCompany,
      getCandidate,
      matchesForCompany,
      matchesForCandidate,
      moveMatch,
      updateMatch,
      updateCandidate,
      updateCompany,
      addCompany,
      addInterest,
      resetData,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
