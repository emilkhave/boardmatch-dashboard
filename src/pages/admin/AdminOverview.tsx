import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/AdminLayout'
import { StatCard } from '../../components/StatCard'
import { Card, CardHeader, Avatar } from '../../components/ui'
import { StageBadge, ScorePill } from '../../components/StageBadge'
import { mockCompanies } from '../../data/mockCompanies'
import { mockCandidates } from '../../data/mockCandidates'
import { mockMatches, matchesForCompany } from '../../data/mockMatches'
import { PIPELINE_STAGES } from '../../types'
import { stageStyles, recentActivity, stageCounts } from '../../lib/pipeline'
import { relativeDays } from '../../lib/format'
import {
  IconBuilding,
  IconUsers,
  IconFlow,
  IconStar,
  IconActivity,
  IconArrowRight,
} from '../../components/icons'

export function AdminOverview() {
  const counts = useMemo(() => stageCounts(mockMatches), [])
  const activity = useMemo(() => recentActivity(8), [])

  const activeCompanies = mockCompanies.filter((c) => c.status === 'active').length
  const placements = mockMatches.filter((m) => m.stage === 'accepted').length
  const inProgress = mockMatches.filter(
    (m) => !['accepted', 'rejected', 'new'].includes(m.stage),
  ).length
  const avgScore = Math.round(
    mockMatches.reduce((s, m) => s + m.matchScore, 0) / mockMatches.length,
  )

  const maxStage = Math.max(...PIPELINE_STAGES.map((s) => counts[s.id]), 1)

  // Hottest matches — the strongest fits still in progress.
  const hotMatches = [...mockMatches]
    .filter((m) => !['accepted', 'rejected'].includes(m.stage))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)

  // Companies needing attention — most open active pipelines.
  const topCompanies = mockCompanies
    .filter((c) => c.status === 'active')
    .map((c) => ({ company: c, count: matchesForCompany(c.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Your board-matching practice at a glance — Wednesday, 4 June 2026"
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active companies"
            value={activeCompanies}
            hint={`${mockCompanies.length} total relationships`}
            icon={<IconBuilding width={18} height={18} />}
          />
          <StatCard
            label="Candidates in network"
            value={mockCandidates.length}
            hint="Across 8 sectors"
            icon={<IconUsers width={18} height={18} />}
          />
          <StatCard
            label="Active conversations"
            value={inProgress}
            delta={{ value: '↑ 6 this month', positive: true }}
            icon={<IconFlow width={18} height={18} />}
          />
          <StatCard
            label="Placements this year"
            value={placements}
            hint={`Avg. fit score ${avgScore}`}
            icon={<IconStar width={18} height={18} />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Pipeline funnel */}
          <Card className="xl:col-span-2">
            <CardHeader
              title="Pipeline by stage"
              subtitle="All candidate–company conversations across the practice"
              action={
                <Link to="/admin/matches" className="btn-ghost text-xs text-accent-700">
                  View pipeline <IconArrowRight width={14} height={14} />
                </Link>
              }
            />
            <div className="space-y-4 p-5">
              {PIPELINE_STAGES.map((s) => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="flex w-32 shrink-0 items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stageStyles[s.id].dot}`} />
                    <span className="text-sm text-ink-600">{s.short}</span>
                  </div>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-sand-100">
                    <div
                      className={`flex h-full items-center rounded-lg ${stageStyles[s.id].bar} transition-all duration-500`}
                      style={{ width: `${Math.max((counts[s.id] / maxStage) * 100, counts[s.id] ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink-800">
                    {counts[s.id]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader title="Recent activity" subtitle="Latest pipeline movements" />
            <div className="max-h-[360px] divide-y divide-ink-100 overflow-y-auto">
              {activity.map((a) => (
                <div key={`${a.matchId}-${a.id}`} className="flex gap-3 px-5 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                    <IconActivity width={14} height={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink-700">{a.text}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      {a.candidateName} · {a.companyName} · {relativeDays(a.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Hot matches */}
          <Card>
            <CardHeader
              title="Strongest active matches"
              subtitle="Highest-fit candidates still in play"
              action={
                <Link to="/admin/candidates" className="btn-ghost text-xs text-accent-700">
                  All candidates
                </Link>
              }
            />
            <div className="divide-y divide-ink-100">
              {hotMatches.map((m) => {
                const cand = mockCandidates.find((c) => c.id === m.candidateId)!
                const comp = mockCompanies.find((c) => c.id === m.companyId)!
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={cand.name} color={cand.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{cand.name}</p>
                      <p className="truncate text-xs text-ink-400">→ {comp.name}</p>
                    </div>
                    <StageBadge stage={m.stage} />
                    <ScorePill score={m.matchScore} />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Active companies */}
          <Card>
            <CardHeader
              title="Active searches"
              subtitle="Companies currently recruiting"
              action={
                <Link to="/admin/companies" className="btn-ghost text-xs text-accent-700">
                  All companies
                </Link>
              }
            />
            <div className="divide-y divide-ink-100">
              {topCompanies.map(({ company, count }) => (
                <Link
                  key={company.id}
                  to={`/admin/companies/${company.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-sand-50"
                >
                  <Avatar name={company.name} color={company.logoColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{company.name}</p>
                    <p className="truncate text-xs text-ink-400">{company.seatTitle}</p>
                  </div>
                  <span className="rounded-lg bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                    {count} in pipeline
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
