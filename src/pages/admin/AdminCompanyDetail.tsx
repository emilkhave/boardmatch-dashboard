import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { companyById } from '../../data/mockCompanies'
import { useData } from '../../lib/store'
import { Avatar, Card, CardHeader, Tag } from '../../components/ui'
import { StageBadge, ScorePill } from '../../components/StageBadge'
import { CandidateDetail } from '../../components/CandidateDetail'
import { PIPELINE_STAGES } from '../../types'
import { stageCounts } from '../../lib/pipeline'
import { relativeDays } from '../../lib/format'
import { IconArrowRight, IconMail, IconPin, IconBriefcase } from '../../components/icons'

export function AdminCompanyDetail() {
  const { id } = useParams()
  const { matchesForCompany, getCandidate, moveMatch, updateMatch, updateCandidate } = useData()
  const company = id ? companyById(id) : undefined
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)

  if (!company) {
    return (
      <div className="p-8">
        <p className="text-sm text-ink-500">Company not found.</p>
        <Link to="/admin/companies" className="btn-secondary mt-4">
          Back to companies
        </Link>
      </div>
    )
  }

  const pipeline = matchesForCompany(company.id)
  const counts = stageCounts(pipeline)
  const openMatch = pipeline.find((m) => m.id === openMatchId) ?? null
  const openCandidate = openMatch ? getCandidate(openMatch.candidateId) : undefined

  return (
    <>
      {/* Breadcrumb header */}
      <div className="border-b border-ink-200/60 bg-white px-6 py-5 lg:px-8">
        <Link
          to="/admin/companies"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-400 transition hover:text-ink-700"
        >
          ← Companies
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={company.name} color={company.logoColor} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1">
                <IconBriefcase width={15} height={15} /> {company.industry}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconPin width={15} height={15} /> {company.location}
              </span>
              <span>Founded {company.founded}</span>
            </div>
          </div>
          <a href={`mailto:${company.contactEmail}`} className="btn-secondary">
            <IconMail width={16} height={16} /> Contact
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-3 lg:px-8">
        {/* Left column: profile */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader title="Open seat" />
            <div className="space-y-4 p-5">
              <div>
                <p className="text-base font-semibold text-ink-900">{company.seatTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Tag tone="accent">{company.seatType}</Tag>
                  <Tag>{company.seatsOpen} seat{company.seatsOpen > 1 ? 's' : ''} open</Tag>
                </div>
              </div>
              <Detail label="Compensation" value={company.compensation} />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Required competencies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {company.requiredCompetencies.map((rc) => (
                    <Tag key={rc} tone="accent">
                      {rc}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Company profile" />
            <div className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-ink-700">{company.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Industry" value={company.industry} />
                <Detail label="Size" value={company.size} />
                <Detail label="Revenue" value={company.revenue} />
                <Detail label="Website" value={company.website} />
              </div>
              <div className="border-t border-ink-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Primary contact
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={company.contactName} color={company.logoColor} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-ink-900">{company.contactName}</p>
                    <p className="text-xs text-ink-400">{company.contactRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: pipeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Candidate pipeline"
              subtitle={`${pipeline.length} candidates · ${counts.in_dialogue + counts.negotiation} in advanced stages`}
            />
            <div className="space-y-5 p-5">
              {PIPELINE_STAGES.filter((s) => counts[s.id] > 0).map((stage) => (
                <div key={stage.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <StageBadge stage={stage.id} />
                    <span className="text-xs text-ink-400">{counts[stage.id]}</span>
                  </div>
                  <div className="space-y-2">
                    {pipeline
                      .filter((m) => m.stage === stage.id)
                      .sort((a, b) => b.matchScore - a.matchScore)
                      .map((m) => {
                        const cand = getCandidate(m.candidateId)!
                        return (
                          <button
                            key={m.id}
                            onClick={() => setOpenMatchId(m.id)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 text-left transition hover:border-accent-200 hover:bg-accent-50/40"
                          >
                            <Avatar name={cand.name} color={cand.avatarColor} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink-900">{cand.name}</p>
                              <p className="truncate text-xs text-ink-400">{cand.title}</p>
                            </div>
                            <span className="hidden text-xs text-ink-400 sm:block">
                              {relativeDays(m.lastContact)}
                            </span>
                            <ScorePill score={m.matchScore} />
                            <IconArrowRight
                              width={16}
                              height={16}
                              className="text-ink-300 transition group-hover:text-accent-600"
                            />
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {openMatch && openCandidate && (
        <CandidateDetail
          candidate={openCandidate}
          match={openMatch}
          companyName={company.name}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-800">{value}</p>
    </div>
  )
}
