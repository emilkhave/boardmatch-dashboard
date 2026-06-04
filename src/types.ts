// ---------------------------------------------------------------------------
// Domain types for BoardMatch.
// Designed to map cleanly onto database tables later:
//   companies, candidates, matches (join table), activity_log
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'new'
  | 'interested'
  | 'contacted'
  | 'interview'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'

export const PIPELINE_STAGES: { id: PipelineStage; label: string; short: string }[] = [
  { id: 'new', label: 'New candidates', short: 'New' },
  { id: 'interested', label: 'Interested', short: 'Interested' },
  { id: 'contacted', label: 'Contacted', short: 'Contacted' },
  { id: 'interview', label: 'Interview / dialogue', short: 'Interview' },
  { id: 'shortlisted', label: 'Shortlisted', short: 'Shortlisted' },
  { id: 'accepted', label: 'Accepted', short: 'Accepted' },
  { id: 'rejected', label: 'Rejected', short: 'Rejected' },
]

// Stages shown as columns in the company kanban (accepted/rejected handled separately)
export const ACTIVE_STAGES: PipelineStage[] = [
  'new',
  'interested',
  'contacted',
  'interview',
  'shortlisted',
]

export interface Company {
  id: string
  name: string
  logoColor: string // hex for monogram avatar background
  industry: string
  location: string
  size: string // employee band
  revenue: string
  founded: number
  website: string
  description: string
  // The board seat(s) they are recruiting for
  seatTitle: string
  seatType: 'Board Chair' | 'Board Member' | 'Advisory Board' | 'Audit Committee'
  seatsOpen: number
  compensation: string
  // What they are looking for
  requiredCompetencies: string[]
  // Primary contact at the company (used for the company login persona)
  contactName: string
  contactRole: string
  contactEmail: string
  status: 'active' | 'paused' | 'placed'
  createdAt: string // ISO date
}

export interface Candidate {
  id: string
  name: string
  title: string // current / most recent role
  location: string
  experienceYears: number
  bio: string
  competencies: string[]
  sectors: string[]
  boardExperience: string // narrative of prior board roles
  currentBoards: number
  availability: 'Available' | 'Open to offers' | 'Limited'
  email: string
  phone: string
  linkedin: string
  avatarColor: string
  createdAt: string
}

export interface MatchActivity {
  id: string
  date: string // ISO
  type: 'stage_change' | 'note' | 'email' | 'call' | 'meeting' | 'created'
  text: string
  author: string
}

// The join between a company and a candidate — the heart of the pipeline.
export interface Match {
  id: string
  companyId: string
  candidateId: string
  stage: PipelineStage
  matchScore: number // 0-100 fit indicator
  lastContact: string | null // ISO date
  nextStep: string | null
  notes: string
  history: MatchActivity[]
}

export type Role = 'admin' | 'company'

export interface Session {
  role: Role
  // for company sessions, which company they represent
  companyId?: string
  name: string
  email: string
}
