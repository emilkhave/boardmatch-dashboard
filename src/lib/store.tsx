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
