import type { Match, MatchActivity, PipelineStage } from '../types'
import { mockMatches } from '../data/mockMatches'
import { candidateById } from '../data/mockCandidates'
import { companyById } from '../data/mockCompanies'

// Visual styling per stage — shared by badges and kanban columns.
export const stageStyles: Record<
  PipelineStage,
  { label: string; dot: string; chip: string; bar: string }
> = {
  new: {
    label: 'New',
    dot: 'bg-ink-400',
    chip: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200',
    bar: 'bg-ink-300',
  },
  interested: {
    label: 'Interested',
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    bar: 'bg-sky-400',
  },
  contacted: {
    label: 'Contacted',
    dot: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
    bar: 'bg-violet-400',
  },
  interview: {
    label: 'Interview',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    bar: 'bg-amber-400',
  },
  shortlisted: {
    label: 'Shortlisted',
    dot: 'bg-accent-500',
    chip: 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200',
    bar: 'bg-accent-500',
  },
  accepted: {
    label: 'Accepted',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    bar: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    dot: 'bg-rose-400',
    chip: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200',
    bar: 'bg-rose-400',
  },
}

export function matchScoreTone(score: number): string {
  if (score >= 90) return 'bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200'
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
  if (score >= 70) return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
  return 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200'
}

export function matchScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent fit'
  if (score >= 80) return 'Strong fit'
  if (score >= 70) return 'Good fit'
  return 'Possible fit'
}

// Aggregate counts by stage for a set of matches.
export function stageCounts(matches: Match[]): Record<PipelineStage, number> {
  const base: Record<PipelineStage, number> = {
    new: 0,
    interested: 0,
    contacted: 0,
    interview: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
  }
  for (const m of matches) base[m.stage]++
  return base
}

export interface ActivityEntry extends MatchActivity {
  matchId: string
  companyId: string
  candidateId: string
  candidateName: string
  companyName: string
}

// Flatten all match histories into a single, reverse-chronological feed.
export function recentActivity(limit = 12): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  for (const m of mockMatches) {
    for (const h of m.history) {
      entries.push({
        ...h,
        matchId: m.id,
        companyId: m.companyId,
        candidateId: m.candidateId,
        candidateName: candidateById(m.candidateId)?.name ?? 'Unknown',
        companyName: companyById(m.companyId)?.name ?? 'Unknown',
      })
    }
  }
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries.slice(0, limit)
}
