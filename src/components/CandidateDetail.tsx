import { useEffect, useState } from 'react'
import type { Candidate, Match, PipelineStage } from '../types'
import { PIPELINE_STAGES } from '../types'
import { Avatar, Tag } from './ui'
import { StageBadge } from './StageBadge'
import { matchScoreLabel } from '../lib/pipeline'
import { formatDate, relativeDays } from '../lib/format'
import {
  IconClose,
  IconMail,
  IconPhone,
  IconLink,
  IconPin,
  IconBriefcase,
  IconStar,
  IconClock,
  IconArrowRight,
  IconCheck,
} from './icons'

const activityIcon: Record<string, string> = {
  created: '✚',
  email: '✉',
  call: '☎',
  meeting: '◷',
  note: '✎',
  stage_change: '→',
}

export interface CandidateDetailProps {
  candidate: Candidate
  match?: Match
  companyName?: string
  onClose: () => void
  /** When true, an Edit button is shown and the panel can be edited in place. */
  editable?: boolean
  onSaveCandidate?: (candidateId: string, patch: Partial<Candidate>) => void
  onSaveMatch?: (matchId: string, patch: Partial<Match>) => void
  onMoveStage?: (matchId: string, stage: PipelineStage) => void
}

export function CandidateDetail(props: CandidateDetailProps) {
  const { candidate, match, companyName, onClose, editable } = props
  const [editing, setEditing] = useState(false)

  // Close on Escape (only when not editing) and lock background scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editing) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, editing])

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-ink-950/30 backdrop-blur-sm animate-fade-in"
        onClick={() => !editing && onClose()}
      />

      <div className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-sand-50 shadow-lift animate-fade-in">
        {/* Header */}
        <div className="relative border-b border-ink-100 bg-white px-6 pb-5 pt-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <IconClose />
          </button>
          <div className="flex items-start gap-4 pr-10">
            <Avatar name={candidate.name} color={candidate.avatarColor} size="xl" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-ink-900">{candidate.name}</h2>
              <p className="mt-0.5 text-sm text-ink-600">{candidate.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <IconPin width={14} height={14} /> {candidate.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconBriefcase width={14} height={14} /> {candidate.experienceYears} yrs experience
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconStar width={14} height={14} /> {candidate.currentBoards} current boards
                </span>
              </div>
              {editable && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary mt-3 px-3 py-1.5 text-xs"
                >
                  Edit candidate
                </button>
              )}
            </div>
          </div>

          {match && !editing && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-sand-100 p-3">
              {companyName && (
                <span className="w-full text-xs font-medium text-ink-500">
                  In <span className="text-ink-700">{companyName}</span>’s pipeline
                </span>
              )}
              <StageBadge stage={match.stage} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-500">Match</span>
                <span className="text-sm font-semibold text-accent-700">{match.matchScore}</span>
                <span className="text-xs text-ink-400">· {matchScoreLabel(match.matchScore)}</span>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-ink-500">
                <IconClock width={14} height={14} />
                Last contact: {relativeDays(match.lastContact)}
              </span>
            </div>
          )}
        </div>

        {editing ? (
          <EditForm {...props} onDone={() => setEditing(false)} />
        ) : (
          <ReadView candidate={candidate} match={match} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

// ── Read-only body ──────────────────────────────────────────────────────────
function ReadView({
  candidate,
  match,
  onClose,
}: {
  candidate: Candidate
  match?: Match
  onClose: () => void
}) {
  return (
    <>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
              candidate.availability === 'Available'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                : candidate.availability === 'Open to offers'
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {candidate.availability}
          </span>
          {candidate.sectors.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>

        <Section title="Profile">
          <p className="text-sm leading-relaxed text-ink-700">{candidate.bio}</p>
        </Section>

        <Section title="Board-relevant competencies">
          <div className="flex flex-wrap gap-2">
            {candidate.competencies.map((c) => (
              <Tag key={c} tone="accent">
                {c}
              </Tag>
            ))}
          </div>
        </Section>

        <Section title="Board experience">
          <p className="text-sm leading-relaxed text-ink-700">{candidate.boardExperience}</p>
        </Section>

        <Section title="Contact details">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ContactRow icon={<IconMail width={16} height={16} />} value={candidate.email} href={`mailto:${candidate.email}`} />
            <ContactRow icon={<IconPhone width={16} height={16} />} value={candidate.phone} href={`tel:${candidate.phone.replace(/\s/g, '')}`} />
            <ContactRow icon={<IconLink width={16} height={16} />} value={candidate.linkedin} href={`https://${candidate.linkedin}`} />
          </div>
        </Section>

        {match && (
          <>
            <Section title="Notes & status">
              <div className="rounded-xl border border-ink-100 bg-white p-4">
                <p className="text-sm leading-relaxed text-ink-700">{match.notes || 'No notes yet.'}</p>
                {match.nextStep && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-800">
                    <IconArrowRight width={14} height={14} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold">Next step: </span>
                      {match.nextStep}
                    </span>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Activity">
              <ol className="relative space-y-4 pl-1">
                {[...match.history].reverse().map((h, i, arr) => (
                  <li key={h.id} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-600 text-xs text-white">
                        {activityIcon[h.type] ?? '•'}
                      </span>
                      {i < arr.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-200" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm text-ink-700">{h.text}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {formatDate(h.date)} · {h.author}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-ink-100 bg-white px-6 py-4">
        <a href={`mailto:${candidate.email}`} className="btn-primary flex-1">
          <IconMail width={16} height={16} />
          Contact candidate
        </a>
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  )
}

// ── Editable body ───────────────────────────────────────────────────────────
function EditForm({
  candidate,
  match,
  onSaveCandidate,
  onSaveMatch,
  onMoveStage,
  onDone,
}: CandidateDetailProps & { onDone: () => void }) {
  const [name, setName] = useState(candidate.name)
  const [title, setTitle] = useState(candidate.title)
  const [location, setLocation] = useState(candidate.location)
  const [experienceYears, setExperienceYears] = useState(String(candidate.experienceYears))
  const [availability, setAvailability] = useState<Candidate['availability']>(candidate.availability)
  const [bio, setBio] = useState(candidate.bio)
  const [competencies, setCompetencies] = useState(candidate.competencies.join(', '))
  const [email, setEmail] = useState(candidate.email)
  const [phone, setPhone] = useState(candidate.phone)

  const [stage, setStage] = useState<PipelineStage>(match?.stage ?? 'interested')
  const [matchScore, setMatchScore] = useState(String(match?.matchScore ?? 0))
  const [nextStep, setNextStep] = useState(match?.nextStep ?? '')
  const [notes, setNotes] = useState(match?.notes ?? '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveCandidate?.(candidate.id, {
      name: name.trim() || candidate.name,
      title: title.trim(),
      location: location.trim(),
      experienceYears: Number(experienceYears) || candidate.experienceYears,
      availability,
      bio: bio.trim(),
      competencies: competencies
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      email: email.trim(),
      phone: phone.trim(),
    })

    if (match) {
      if (stage !== match.stage) onMoveStage?.(match.id, stage)
      onSaveMatch?.(match.id, {
        matchScore: Math.max(0, Math.min(100, Number(matchScore) || match.matchScore)),
        nextStep: nextStep.trim() || null,
        notes: notes.trim(),
      })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <p className="rounded-xl bg-accent-50 px-4 py-2.5 text-xs text-accent-800">
          Editing candidate {match ? 'and pipeline status' : 'profile'}. Changes are saved locally.
        </p>

        <Field label="Full name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Role / title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location">
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Years of experience">
            <input
              className="input"
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Availability">
          <select
            className="input appearance-none"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as Candidate['availability'])}
          >
            <option>Available</option>
            <option>Open to offers</option>
            <option>Limited</option>
          </select>
        </Field>
        <Field label="Profile / bio">
          <textarea className="input min-h-20 resize-y" value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Field label="Competencies (comma-separated)">
          <input
            className="input"
            value={competencies}
            onChange={(e) => setCompetencies(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>

        {match && (
          <div className="space-y-5 border-t border-ink-100 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Pipeline status
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stage">
                <select
                  className="input appearance-none"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as PipelineStage)}
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fit score (0–100)">
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={matchScore}
                  onChange={(e) => setMatchScore(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Next step">
              <input className="input" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
            </Field>
            <Field label="Notes">
              <textarea
                className="input min-h-24 resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-ink-100 bg-white px-6 py-4">
        <button type="submit" className="btn-primary flex-1">
          <IconCheck width={16} height={16} />
          Save changes
        </button>
        <button type="button" className="btn-secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

function ContactRow({ icon, value, href }: { icon: React.ReactNode; value: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="group flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-700 transition hover:border-accent-200 hover:bg-accent-50"
    >
      <span className="text-ink-400 transition group-hover:text-accent-600">{icon}</span>
      <span className="truncate">{value}</span>
    </a>
  )
}
