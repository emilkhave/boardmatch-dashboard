import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/AdminLayout'
import { Avatar, Tag } from '../../components/ui'
import { CandidateDetail } from '../../components/CandidateDetail'
import { useData } from '../../lib/store'
import { IconSearch, IconPin } from '../../components/icons'

const availabilityFilters = ['All', 'Available', 'Open to offers', 'Limited'] as const

export function AdminCandidates() {
  const { candidates, matchesForCandidate, getCandidate, updateCandidate } = useData()
  const [query, setQuery] = useState('')
  const [avail, setAvail] = useState<(typeof availabilityFilters)[number]>('All')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return candidates.filter((c) => {
      const matchesAvail = avail === 'All' || c.availability === avail
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.competencies.some((comp) => comp.toLowerCase().includes(q)) ||
        c.sectors.some((s) => s.toLowerCase().includes(q))
      return matchesAvail && matchesQuery
    })
  }, [query, avail, candidates])

  const open = openId ? getCandidate(openId) : undefined

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={`${candidates.length} board members in your network`}
      />

      <div className="space-y-5 px-6 py-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <IconSearch
              width={18}
              height={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              className="input pl-10"
              placeholder="Search by name, role, competency…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1">
            {availabilityFilters.map((a) => (
              <button
                key={a}
                onClick={() => setAvail(a)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  avail === a ? 'bg-accent-700 text-white' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const pipelines = matchesForCandidate(c.id)
            return (
              <button
                key={c.id}
                onClick={() => setOpenId(c.id)}
                className="card group flex flex-col p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} color={c.avatarColor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-ink-900">{c.name}</h3>
                    <p className="truncate text-xs text-ink-500">{c.title}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
                      <IconPin width={12} height={12} /> {c.location}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.competencies.slice(0, 3).map((comp) => (
                    <Tag key={comp}>{comp}</Tag>
                  ))}
                  {c.competencies.length > 3 && <Tag>+{c.competencies.length - 3}</Tag>}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${
                      c.availability === 'Available'
                        ? 'text-emerald-600'
                        : c.availability === 'Open to offers'
                          ? 'text-sky-600'
                          : 'text-amber-600'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {c.availability}
                  </span>
                  <span className="text-ink-400">
                    {c.experienceYears} yrs ·{' '}
                    {pipelines.length > 0 ? `${pipelines.length} pipeline${pipelines.length > 1 ? 's' : ''}` : 'No pipeline'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card py-16 text-center text-sm text-ink-400">No candidates match your search.</div>
        )}
      </div>

      {open && (
        <CandidateDetail
          candidate={open}
          editable
          onSaveCandidate={updateCandidate}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}
