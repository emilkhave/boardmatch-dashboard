import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/AdminLayout'
import { Avatar, Tag } from '../../components/ui'
import { mockCompanies } from '../../data/mockCompanies'
import { matchesForCompany } from '../../data/mockMatches'
import { IconSearch, IconArrowRight } from '../../components/icons'

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  placed: 'bg-ink-100 text-ink-600 ring-ink-200',
}

export function AdminCompanies() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'paused' | 'placed'>('all')

  const filtered = useMemo(() => {
    return mockCompanies.filter((c) => {
      const matchesStatus = status === 'all' || c.status === status
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [query, status])

  return (
    <>
      <PageHeader title="Companies" subtitle={`${mockCompanies.length} companies recruiting for board seats`} />

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
              placeholder="Search companies, industry, location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1">
            {(['all', 'active', 'paused', 'placed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  status === s ? 'bg-accent-700 text-white' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const pipeline = matchesForCompany(c.id)
            return (
              <Link
                key={c.id}
                to={`/admin/companies/${c.id}`}
                className="card group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <Avatar name={c.name} color={c.logoColor} size="lg" />
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{c.name}</h3>
                <p className="mt-0.5 text-xs text-ink-400">
                  {c.industry} · {c.location}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-ink-600">{c.seatTitle}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.requiredCompetencies.slice(0, 2).map((rc) => (
                    <Tag key={rc}>{rc}</Tag>
                  ))}
                  {c.requiredCompetencies.length > 2 && (
                    <Tag>+{c.requiredCompetencies.length - 2}</Tag>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-xs text-ink-500">
                    <span className="font-semibold text-ink-800">{pipeline.length}</span> candidates
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-700 opacity-0 transition group-hover:opacity-100">
                    View profile <IconArrowRight width={14} height={14} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card py-16 text-center text-sm text-ink-400">No companies match your filters.</div>
        )}
      </div>
    </>
  )
}
