import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/AdminLayout'
import { Avatar } from '../../components/ui'
import { StageBadge, ScorePill } from '../../components/StageBadge'
import { CandidateDetail } from '../../components/CandidateDetail'
import { useData } from '../../lib/store'
import { companyById } from '../../data/mockCompanies'
import { PIPELINE_STAGES, type PipelineStage } from '../../types'
import { stageCounts, stageStyles } from '../../lib/pipeline'
import { relativeDays, daysSince } from '../../lib/format'
import { IconSearch } from '../../components/icons'

export function AdminMatches() {
  const { matches, getCandidate, moveMatch, updateMatch, updateCandidate } = useData()
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all')
  const [query, setQuery] = useState('')
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)

  const counts = useMemo(() => stageCounts(matches), [matches])

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return matches
      .map((m) => ({
        match: m,
        candidate: getCandidate(m.candidateId)!,
        company: companyById(m.companyId)!,
      }))
      .filter(({ match, candidate, company }) => {
        const matchesStage = stageFilter === 'all' || match.stage === stageFilter
        const matchesQuery =
          !q ||
          candidate.name.toLowerCase().includes(q) ||
          company.name.toLowerCase().includes(q)
        return matchesStage && matchesQuery
      })
      .sort((a, b) => b.match.matchScore - a.match.matchScore)
  }, [stageFilter, query, matches, getCandidate])

  const open = matches.find((m) => m.id === openMatchId) ?? null
  const openCandidate = open ? getCandidate(open.candidateId) : undefined
  const openCompany = open ? companyById(open.companyId) : undefined

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Every candidate–company match across the practice"
      />

      <div className="space-y-5 px-6 py-6 lg:px-8">
        {/* Stage summary chips */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          <button
            onClick={() => setStageFilter('all')}
            className={`card flex flex-col items-start p-3.5 text-left transition hover:shadow-soft ${
              stageFilter === 'all' ? 'ring-2 ring-accent-400' : ''
            }`}
          >
            <span className="text-xs text-ink-500">All</span>
            <span className="mt-1 text-xl font-semibold text-ink-900">{matches.length}</span>
          </button>
          {PIPELINE_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStageFilter(s.id)}
              className={`card flex flex-col items-start p-3.5 text-left transition hover:shadow-soft ${
                stageFilter === s.id ? 'ring-2 ring-accent-400' : ''
              }`}
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
                <span className={`h-1.5 w-1.5 rounded-full ${stageStyles[s.id].dot}`} />
                {s.short}
              </span>
              <span className="mt-1 text-xl font-semibold text-ink-900">{counts[s.id]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <IconSearch
            width={18}
            height={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            className="input pl-10"
            placeholder="Search candidate or company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Matches table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Fit</th>
                  <th className="px-5 py-3 font-medium">Last contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map(({ match, candidate, company }) => {
                  const stale = daysSince(match.lastContact)
                  const isStale = stale !== null && stale > 21 && !['accepted', 'rejected'].includes(match.stage)
                  return (
                    <tr
                      key={match.id}
                      onClick={() => setOpenMatchId(match.id)}
                      className="cursor-pointer transition hover:bg-sand-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={candidate.name} color={candidate.avatarColor} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-900">{candidate.name}</p>
                            <p className="truncate text-xs text-ink-400">{candidate.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={company.name} color={company.logoColor} size="sm" />
                          <span className="truncate text-ink-700">{company.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StageBadge stage={match.stage} />
                      </td>
                      <td className="px-5 py-3">
                        <ScorePill score={match.matchScore} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={isStale ? 'font-medium text-amber-600' : 'text-ink-500'}>
                          {relativeDays(match.lastContact)}
                          {isStale && ' ⚠'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="py-14 text-center text-sm text-ink-400">No matches for this filter.</div>
          )}
        </div>
      </div>

      {open && openCandidate && (
        <CandidateDetail
          candidate={openCandidate}
          match={open}
          companyName={openCompany?.name}
          editable
          onSaveCandidate={updateCandidate}
          onSaveMatch={updateMatch}
          onMoveStage={(mid, stage) => moveMatch(mid, stage)}
          onClose={() => setOpenMatchId(null)}
        />
      )}
    </>
  )
}
