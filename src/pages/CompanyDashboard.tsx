import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { companyById } from '../data/mockCompanies'
import { Avatar, Tag } from '../components/ui'
import { ScorePill } from '../components/StageBadge'
import { StatCard } from '../components/StatCard'
import { CandidateDetail } from '../components/CandidateDetail'
import { ACTIVE_STAGES, PIPELINE_STAGES, type Candidate, type Match, type PipelineStage } from '../types'
import { stageStyles, stageCounts } from '../lib/pipeline'
import { relativeDays, daysSince } from '../lib/format'
import { IconLogout, IconUsers, IconStar, IconClock, IconCheck } from '../components/icons'

// Stages that still need active follow-up (excludes the terminal columns).
const FOLLOW_UP_STAGES: PipelineStage[] = ['interested', 'first_meeting', 'in_dialogue', 'negotiation']

export function CompanyDashboard() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const { matchesForCompany, getCandidate, moveMatch, updateMatch, updateCandidate } = useData()

  const [openMatchId, setOpenMatchId] = useState<string | null>(null)
  const [dragStage, setDragStage] = useState<PipelineStage | null>(null)

  const company = session?.companyId ? companyById(session.companyId) : undefined
  const pipeline = useMemo(
    () => (company ? matchesForCompany(company.id) : []),
    [company, matchesForCompany],
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

  const openMatch = pipeline.find((m) => m.id === openMatchId) ?? null
  const openCandidate = openMatch ? getCandidate(openMatch.candidateId) : undefined

  const needsFollowUp = pipeline.filter((m) => {
    const d = daysSince(m.lastContact)
    return FOLLOW_UP_STAGES.includes(m.stage) && (d === null || d > 14)
  }).length

  const handleDrop = (stage: PipelineStage) => (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) moveMatch(id, stage, session?.name ?? 'Company')
    setDragStage(null)
  }

  return (
    <div className="min-h-screen bg-sand-100">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-5 py-3 lg:px-8">
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

      <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-6 lg:px-8">
        {/* Seat banner — kept intentionally clean */}
        <div className="overflow-hidden rounded-2xl bg-accent-800 p-6 text-white shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-200">Recruiting for</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">{company.seatTitle}</h1>
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
            value={counts.in_dialogue + counts.negotiation}
            hint="In dialogue & negotiation"
            icon={<IconStar width={18} height={18} />}
          />
          <StatCard
            label="Needs follow-up"
            value={needsFollowUp}
            hint="No contact in 14+ days"
            icon={<IconClock width={18} height={18} />}
          />
          <StatCard
            label="Signed"
            value={counts.signed}
            hint="Seat accepted"
            icon={<IconCheck width={18} height={18} />}
          />
        </div>

        {/* Kanban pipeline */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Candidate pipeline</h2>
            <p className="text-xs text-ink-400">
              Drag candidates between columns · click to view &amp; edit
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {ACTIVE_STAGES.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                matches={pipeline
                  .filter((m) => m.stage === stage)
                  .sort((a, b) => b.matchScore - a.matchScore)}
                getCandidateName={(id) => getCandidate(id)}
                isDropTarget={dragStage === stage}
                onOpen={setOpenMatchId}
                onDragOverColumn={(e) => {
                  e.preventDefault()
                  if (dragStage !== stage) setDragStage(stage)
                }}
                onDragLeaveColumn={() => setDragStage((s) => (s === stage ? null : s))}
                onDrop={handleDrop(stage)}
              />
            ))}
          </div>
        </div>
      </div>

      {openMatch && openCandidate && (
        <CandidateDetail
          candidate={openCandidate}
          match={openMatch}
          editable
          onSaveCandidate={updateCandidate}
          onSaveMatch={updateMatch}
          onMoveStage={(id, stage) => moveMatch(id, stage, session?.name ?? 'Company')}
          onClose={() => setOpenMatchId(null)}
        />
      )}
    </div>
  )
}

function PipelineColumn({
  stage,
  matches,
  getCandidateName,
  isDropTarget,
  onOpen,
  onDragOverColumn,
  onDragLeaveColumn,
  onDrop,
}: {
  stage: PipelineStage
  matches: Match[]
  getCandidateName: (id: string) => Candidate | undefined
  isDropTarget: boolean
  onOpen: (id: string) => void
  onDragOverColumn: (e: React.DragEvent) => void
  onDragLeaveColumn: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  const meta = PIPELINE_STAGES.find((s) => s.id === stage)!
  const s = stageStyles[stage]
  return (
    <div
      onDragOver={onDragOverColumn}
      onDragLeave={onDragLeaveColumn}
      onDrop={onDrop}
      className={`flex flex-col rounded-2xl ring-1 transition-colors ${
        isDropTarget ? 'bg-accent-50 ring-2 ring-accent-400' : 'bg-sand-50 ring-ink-200/50'
      }`}
    >
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
          const cand = getCandidateName(m.candidateId)
          if (!cand) return null
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              draggable
              onClick={() => onOpen(m.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onOpen(m.id)
                }
              }}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', m.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              className="group cursor-grab rounded-xl border border-ink-100 bg-white p-3 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-soft active:cursor-grabbing"
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
            </div>
          )
        })}
        {matches.length === 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-ink-200 py-6 text-xs text-ink-300">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}
