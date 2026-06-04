import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { companyById } from '../data/mockCompanies'
import { matchesForCompany } from '../data/mockMatches'
import { candidateById } from '../data/mockCandidates'
import { Avatar, Tag } from '../components/ui'
import { ScorePill } from '../components/StageBadge'
import { StatCard } from '../components/StatCard'
import { CandidateDetail } from '../components/CandidateDetail'
import { ACTIVE_STAGES, PIPELINE_STAGES, type Match, type PipelineStage } from '../types'
import { stageStyles, stageCounts } from '../lib/pipeline'
import { relativeDays, daysSince } from '../lib/format'
import {
  IconLogout,
  IconUsers,
  IconStar,
  IconClock,
  IconCheck,
} from '../components/icons'

export function CompanyDashboard() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [openMatch, setOpenMatch] = useState<Match | null>(null)

  const company = session?.companyId ? companyById(session.companyId) : undefined
  const pipeline = useMemo(
    () => (company ? matchesForCompany(company.id) : []),
    [company],
  )
  const counts = stageCounts(pipeline)

  if (!company) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-ink-500">No company selected.</p>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const accepted = pipeline.filter((m) => m.stage === 'accepted')
  const rejected = pipeline.filter((m) => m.stage === 'rejected')
  const openCandidate = openMatch ? candidateById(openMatch.candidateId) : undefined

  // Candidates needing follow-up: active stage, last contact > 14 days ago.
  const needsFollowUp = pipeline.filter((m) => {
    const d = daysSince(m.lastContact)
    return ACTIVE_STAGES.includes(m.stage) && (d === null || d > 14)
  }).length

  return (
    <div className="min-h-screen bg-sand-100">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-3 lg:px-8">
          <Avatar name={company.name} color={company.logoColor} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{company.name}</p>
            <p className="truncate text-xs text-ink-400">Board recruitment workspace</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-sand-100 px-3 py-1.5 text-xs text-ink-500 sm:flex">
            <span className="font-medium text-ink-700">{session?.name}</span>
            <span className="text-ink-300">·</span>
            <span>{company.contactRole}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            title="Sign out"
          >
            <IconLogout width={18} height={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 lg:px-8">
        {/* Seat banner */}
        <div className="overflow-hidden rounded-2xl bg-accent-800 p-6 text-white shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-accent-200">
                Recruiting for
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold">{company.seatTitle}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium">
                  {company.seatType}
                </span>
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium">
                  {company.compensation}
                </span>
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium">
                  {company.seatsOpen} seat{company.seatsOpen > 1 ? 's' : ''} open
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:max-w-xs sm:justify-end">
              {company.requiredCompetencies.map((rc) => (
                <span
                  key={rc}
                  className="rounded-lg border border-white/20 px-2.5 py-1 text-xs text-accent-50"
                >
                  {rc}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Candidates in pipeline"
            value={pipeline.length}
            icon={<IconUsers width={18} height={18} />}
          />
          <StatCard
            label="In advanced stages"
            value={counts.interview + counts.shortlisted}
            hint="Interview & shortlisted"
            icon={<IconStar width={18} height={18} />}
          />
          <StatCard
            label="Needs follow-up"
            value={needsFollowUp}
            hint="No contact in 14+ days"
            icon={<IconClock width={18} height={18} />}
          />
          <StatCard
            label="Placed"
            value={counts.accepted}
            hint="Seat accepted"
            icon={<IconCheck width={18} height={18} />}
          />
        </div>

        {/* Kanban pipeline */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Candidate pipeline</h2>
            <p className="text-xs text-ink-400">Click a candidate to view their full profile</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ACTIVE_STAGES.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                matches={pipeline
                  .filter((m) => m.stage === stage)
                  .sort((a, b) => b.matchScore - a.matchScore)}
                onOpen={setOpenMatch}
              />
            ))}
          </div>
        </div>

        {/* Decided */}
        {(accepted.length > 0 || rejected.length > 0) && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Decided</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[...accepted, ...rejected].map((m) => {
                const cand = candidateById(m.candidateId)!
                const accepted = m.stage === 'accepted'
                return (
                  <button
                    key={m.id}
                    onClick={() => setOpenMatch(m)}
                    className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition hover:shadow-soft ${
                      accepted ? 'border-emerald-200' : 'border-ink-100'
                    }`}
                  >
                    <Avatar name={cand.name} color={cand.avatarColor} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{cand.name}</p>
                      <p className="truncate text-xs text-ink-400">{cand.title}</p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        accepted
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {accepted ? 'Accepted' : 'Not selected'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {openMatch && openCandidate && (
        <CandidateDetail
          candidate={openCandidate}
          match={openMatch}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div>
  )
}

function PipelineColumn({
  stage,
  matches,
  onOpen,
}: {
  stage: PipelineStage
  matches: Match[]
  onOpen: (m: Match) => void
}) {
  const meta = PIPELINE_STAGES.find((s) => s.id === stage)!
  const s = stageStyles[stage]
  return (
    <div className="flex flex-col rounded-2xl bg-sand-50 ring-1 ring-ink-200/50">
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className="text-sm font-semibold text-ink-800">{meta.short}</span>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold text-ink-500 ring-1 ring-ink-200">
          {matches.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
        {matches.map((m) => {
          const cand = candidateById(m.candidateId)!
          return (
            <button
              key={m.id}
              onClick={() => onOpen(m)}
              className="group rounded-xl border border-ink-100 bg-white p-3 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-soft"
            >
              <div className="flex items-start gap-2.5">
                <Avatar name={cand.name} color={cand.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{cand.name}</p>
                  <p className="truncate text-xs text-ink-400">{cand.title}</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {cand.competencies.slice(0, 2).map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-ink-50 pt-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                  <IconClock width={12} height={12} />
                  {relativeDays(m.lastContact)}
                </span>
                <ScorePill score={m.matchScore} />
              </div>
            </button>
          )
        })}
        {matches.length === 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-ink-200 py-6 text-xs text-ink-300">
            Empty
          </div>
        )}
      </div>
    </div>
  )
}
