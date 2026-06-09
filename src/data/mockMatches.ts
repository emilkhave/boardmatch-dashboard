import type { Match } from '../types'

// The match join-table: each row is a candidate in a company's pipeline.
// Hand-authored to give the featured companies full, believable pipelines.
export const mockMatches: Match[] = [
  // ───────────────────────── Nordlys Energi ─────────────────────────
  {
    id: 'm-001',
    companyId: 'c-nordlys',
    candidateId: 'p-002', // Thomas Krarup — energy CEO
    stage: 'negotiation',
    matchScore: 96,
    lastContact: '2026-05-28',
    nextStep: 'Final interview with full board on 12 June',
    notes:
      'Outstanding fit. Has built and exited two renewable developers — exactly the IPO-readiness profile Mette wants. Chemistry with the chair was strong.',
    history: [
      { id: 'a1', date: '2026-03-02', type: 'created', text: 'Added to Nordlys pipeline by Emil.', author: 'Emil' },
      { id: 'a2', date: '2026-03-09', type: 'email', text: 'Sent introduction and seat brief.', author: 'Emil' },
      { id: 'a3', date: '2026-03-21', type: 'call', text: 'Intro call — very interested, available from Q3.', author: 'Emil' },
      { id: 'a4', date: '2026-04-15', type: 'meeting', text: 'First interview with Chair (Mette). Positive.', author: 'Mette Sørensen' },
      { id: 'a5', date: '2026-05-28', type: 'stage_change', text: 'Moved to Negotiation.', author: 'Emil' },
    ],
  },
  {
    id: 'm-002',
    companyId: 'c-nordlys',
    candidateId: 'p-017', // Astrid Mikkelsen — ESG
    stage: 'in_dialogue',
    matchScore: 91,
    lastContact: '2026-05-22',
    nextStep: 'Schedule second conversation on ESG reporting scope',
    notes: 'Brings the CSRD / EU-taxonomy depth the board currently lacks. Slight concern on time availability.',
    history: [
      { id: 'a1', date: '2026-03-12', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-04-02', type: 'call', text: 'Intro call — keen, open to offers.', author: 'Emil' },
      { id: 'a3', date: '2026-05-22', type: 'meeting', text: 'First interview held.', author: 'Mette Sørensen' },
    ],
  },
  {
    id: 'm-003',
    companyId: 'c-nordlys',
    candidateId: 'p-001', // Annette Bjerregaard — CFO/IPO
    stage: 'first_meeting',
    matchScore: 88,
    lastContact: '2026-05-10',
    nextStep: 'Awaiting reply on availability',
    notes: 'IPO and capital-markets pedigree is ideal for the 2027 listing. Currently weighing two other approaches.',
    history: [
      { id: 'a1', date: '2026-04-20', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-10', type: 'email', text: 'Sent seat brief and compensation details.', author: 'Emil' },
    ],
  },
  {
    id: 'm-004',
    companyId: 'c-nordlys',
    candidateId: 'p-010', // Frederik Aagaard
    stage: 'interested',
    matchScore: 74,
    lastContact: '2026-05-04',
    nextStep: 'Send full company deck',
    notes: 'Governance and capital-allocation strength, though energy-sector exposure is limited.',
    history: [
      { id: 'a1', date: '2026-04-28', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-04', type: 'call', text: 'Expressed interest, wants more detail.', author: 'Emil' },
    ],
  },
  {
    id: 'm-005',
    companyId: 'c-nordlys',
    candidateId: 'p-013', // Birgit Sandberg
    stage: 'interested',
    matchScore: 70,
    lastContact: null,
    nextStep: 'Make first contact',
    notes: 'Experienced chair with international-trade network. Limited availability — approach carefully.',
    history: [{ id: 'a1', date: '2026-05-30', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },
  {
    id: 'm-006',
    companyId: 'c-nordlys',
    candidateId: 'p-024', // Magnus Halvorsen
    stage: 'interested',
    matchScore: 64,
    lastContact: null,
    nextStep: 'Assess fit vs. infrastructure requirement',
    notes: 'Strong operations and electrification background; sits adjacent to the core energy ask.',
    history: [{ id: 'a1', date: '2026-06-01', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Saga Biotech ─────────────────────────
  {
    id: 'm-010',
    companyId: 'c-saga',
    candidateId: 'p-003', // Dr. Louise Winther
    stage: 'negotiation',
    matchScore: 97,
    lastContact: '2026-05-25',
    nextStep: 'Reference checks, then offer',
    notes: 'Perfect clinical + regulatory profile. Anders is very keen. Main risk is her limited availability (3 boards already).',
    history: [
      { id: 'a1', date: '2026-02-10', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-02-28', type: 'meeting', text: 'Met CEO Anders Holm — strong rapport.', author: 'Anders Holm' },
      { id: 'a3', date: '2026-04-12', type: 'meeting', text: 'Scientific deep-dive with R&D team.', author: 'Anders Holm' },
      { id: 'a4', date: '2026-05-25', type: 'stage_change', text: 'Moved to Negotiation.', author: 'Emil' },
    ],
  },
  {
    id: 'm-011',
    companyId: 'c-saga',
    candidateId: 'p-023', // Charlotte Engel — IR/IPO
    stage: 'in_dialogue',
    matchScore: 84,
    lastContact: '2026-05-18',
    nextStep: 'Second interview with CFO',
    notes: 'Useful capital-markets and IR experience as Saga approaches financing milestones.',
    history: [
      { id: 'a1', date: '2026-03-15', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-18', type: 'meeting', text: 'First interview.', author: 'Anders Holm' },
    ],
  },
  {
    id: 'm-012',
    companyId: 'c-saga',
    candidateId: 'p-022', // Dr. Peter Lindgren — healthtech VC
    stage: 'interested',
    matchScore: 79,
    lastContact: '2026-05-09',
    nextStep: 'Confirm availability and conflicts',
    notes: 'Investor lens valuable, but watch for portfolio conflicts.',
    history: [
      { id: 'a1', date: '2026-04-25', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-09', type: 'call', text: 'Interested, checking conflicts.', author: 'Emil' },
    ],
  },
  {
    id: 'm-013',
    companyId: 'c-saga',
    candidateId: 'p-019', // Nadia Rahman — corporate law
    stage: 'first_meeting',
    matchScore: 72,
    lastContact: '2026-05-15',
    nextStep: 'Follow up next week',
    notes: 'Governance and M&A legal expertise; not biotech-specific.',
    history: [
      { id: 'a1', date: '2026-05-06', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-15', type: 'email', text: 'Sent brief.', author: 'Emil' },
    ],
  },
  {
    id: 'm-014',
    companyId: 'c-saga',
    candidateId: 'p-007', // Sara El-Amin
    stage: 'interested',
    matchScore: 58,
    lastContact: null,
    nextStep: 'Evaluate data/AI angle for digital biomarkers',
    notes: 'Long shot — strong tech profile if Saga prioritises digital R&D.',
    history: [{ id: 'a1', date: '2026-05-29', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Fjordbank ─────────────────────────
  {
    id: 'm-020',
    companyId: 'c-fjordbank',
    candidateId: 'p-015', // Marianne Vestergaard
    stage: 'signed',
    matchScore: 95,
    lastContact: '2026-05-20',
    nextStep: 'Onboarding & committee induction',
    notes: 'Accepted the audit-committee seat. Exceptional regulatory and financial-stability authority. A coup for Fjordbank.',
    history: [
      { id: 'a1', date: '2026-01-10', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-02-05', type: 'meeting', text: 'Interview with Deputy Chair.', author: 'Henrik Lund' },
      { id: 'a3', date: '2026-04-18', type: 'meeting', text: 'Final board interview.', author: 'Henrik Lund' },
      { id: 'a4', date: '2026-05-20', type: 'stage_change', text: 'Offer accepted!', author: 'Emil' },
    ],
  },
  {
    id: 'm-021',
    companyId: 'c-fjordbank',
    candidateId: 'p-006', // Erik Lindqvist — CRO
    stage: 'in_dialogue',
    matchScore: 90,
    lastContact: '2026-05-24',
    nextStep: 'Second-round interview',
    notes: 'Strong back-up to Marianne for the broader risk agenda. Keep warm for a future seat.',
    history: [
      { id: 'a1', date: '2026-02-12', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-24', type: 'meeting', text: 'First interview.', author: 'Henrik Lund' },
    ],
  },
  {
    id: 'm-022',
    companyId: 'c-fjordbank',
    candidateId: 'p-026', // Johan Eklund — cyber
    stage: 'first_meeting',
    matchScore: 81,
    lastContact: '2026-05-12',
    nextStep: 'Gauge interest in risk committee',
    notes: 'Cyber & operational-resilience expertise increasingly board-relevant under DORA / NIS2.',
    history: [
      { id: 'a1', date: '2026-04-30', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-12', type: 'email', text: 'Introductory email sent.', author: 'Emil' },
    ],
  },
  {
    id: 'm-023',
    companyId: 'c-fjordbank',
    candidateId: 'p-019', // Nadia Rahman
    stage: 'interested',
    matchScore: 76,
    lastContact: '2026-05-08',
    nextStep: 'Share governance charter',
    notes: 'Governance and capital-markets legal background fits the modernisation agenda.',
    history: [
      { id: 'a1', date: '2026-04-22', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-08', type: 'call', text: 'Open to a conversation.', author: 'Emil' },
    ],
  },
  {
    id: 'm-024',
    companyId: 'c-fjordbank',
    candidateId: 'p-001', // Annette Bjerregaard
    stage: 'interested',
    matchScore: 73,
    lastContact: null,
    nextStep: 'Assess vs. Nordlys overlap',
    notes: 'Also in Nordlys pipeline — coordinate to avoid competing approaches.',
    history: [{ id: 'a1', date: '2026-05-31', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Velora Retail ─────────────────────────
  {
    id: 'm-030',
    companyId: 'c-velora',
    candidateId: 'p-005', // Camilla Holst — CMO
    stage: 'negotiation',
    matchScore: 94,
    lastContact: '2026-05-26',
    nextStep: 'Meet remaining board members',
    notes: 'Ideal brand + omnichannel profile. Available and enthusiastic. Karin rates her highly.',
    history: [
      { id: 'a1', date: '2026-03-01', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-03-20', type: 'call', text: 'Intro call — available immediately.', author: 'Emil' },
      { id: 'a3', date: '2026-04-25', type: 'meeting', text: 'Interview with Chair.', author: 'Karin Bergström' },
      { id: 'a4', date: '2026-05-26', type: 'stage_change', text: 'Moved to Negotiation.', author: 'Emil' },
    ],
  },
  {
    id: 'm-031',
    companyId: 'c-velora',
    candidateId: 'p-014', // Patrick Nguyen — CDO
    stage: 'in_dialogue',
    matchScore: 89,
    lastContact: '2026-05-21',
    nextStep: 'Second interview on e-commerce roadmap',
    notes: 'Hands-on digital-commerce operator; would be a first board role but very credible.',
    history: [
      { id: 'a1', date: '2026-03-18', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-21', type: 'meeting', text: 'First interview.', author: 'Karin Bergström' },
    ],
  },
  {
    id: 'm-032',
    companyId: 'c-velora',
    candidateId: 'p-025', // Ida Lindberg — brand/growth
    stage: 'first_meeting',
    matchScore: 80,
    lastContact: '2026-05-14',
    nextStep: 'Await response',
    notes: 'Premiumisation and marketing-ROI expertise; complements the digital ask.',
    history: [
      { id: 'a1', date: '2026-05-02', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-14', type: 'email', text: 'Sent brief.', author: 'Emil' },
    ],
  },
  {
    id: 'm-033',
    companyId: 'c-velora',
    candidateId: 'p-008', // Niels Overgaard — supply chain
    stage: 'interested',
    matchScore: 77,
    lastContact: '2026-05-06',
    nextStep: 'Explore supply-chain mandate',
    notes: 'Supply-chain depth useful for the private-label expansion.',
    history: [
      { id: 'a1', date: '2026-04-24', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-06', type: 'call', text: 'Interested.', author: 'Emil' },
    ],
  },
  {
    id: 'm-034',
    companyId: 'c-velora',
    candidateId: 'p-021', // Line Kjær — CHRO
    stage: 'interested',
    matchScore: 66,
    lastContact: null,
    nextStep: 'First contact',
    notes: 'Remuneration / people angle if the board adds a remco specialist.',
    history: [{ id: 'a1', date: '2026-05-30', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Helix Software ─────────────────────────
  {
    id: 'm-040',
    companyId: 'c-helix',
    candidateId: 'p-004', // Michael Strand — PE partner
    stage: 'in_dialogue',
    matchScore: 93,
    lastContact: '2026-05-27',
    nextStep: 'Chair interview with CEO and lead investor',
    notes: 'PE recapitalisation experience is exactly right for the chair role. Strong candidate.',
    history: [
      { id: 'a1', date: '2026-03-10', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-04-08', type: 'call', text: 'Intro call.', author: 'Emil' },
      { id: 'a3', date: '2026-05-27', type: 'meeting', text: 'First interview with CEO Sofie.', author: 'Sofie Kragh' },
    ],
  },
  {
    id: 'm-041',
    companyId: 'c-helix',
    candidateId: 'p-016', // Oliver Brandt — SaaS founder
    stage: 'interested',
    matchScore: 86,
    lastContact: '2026-05-19',
    nextStep: 'Arrange intro with CEO',
    notes: 'DACH/UK scaling experience aligns with Helix growth markets.',
    history: [
      { id: 'a1', date: '2026-04-14', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-19', type: 'call', text: 'Keen and available.', author: 'Emil' },
    ],
  },
  {
    id: 'm-042',
    companyId: 'c-helix',
    candidateId: 'p-020', // Gustav Lindholm — operating partner
    stage: 'first_meeting',
    matchScore: 83,
    lastContact: '2026-05-11',
    nextStep: 'Confirm bandwidth (already on 5 boards)',
    notes: 'Excellent value-creation operator but heavily committed elsewhere.',
    history: [
      { id: 'a1', date: '2026-04-29', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-11', type: 'email', text: 'Sent brief.', author: 'Emil' },
    ],
  },
  {
    id: 'm-043',
    companyId: 'c-helix',
    candidateId: 'p-026', // Johan Eklund — cyber
    stage: 'interested',
    matchScore: 71,
    lastContact: null,
    nextStep: 'First contact',
    notes: 'Security expertise relevant as Helix scales enterprise contracts.',
    history: [{ id: 'a1', date: '2026-06-02', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },
  {
    id: 'm-044',
    companyId: 'c-helix',
    candidateId: 'p-007', // Sara El-Amin
    stage: 'interested',
    matchScore: 75,
    lastContact: null,
    nextStep: 'Assess for technology committee',
    notes: 'Strong engineering leadership; would be a first board seat.',
    history: [{ id: 'a1', date: '2026-06-03', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Lumen Health ─────────────────────────
  {
    id: 'm-050',
    companyId: 'c-lumen',
    candidateId: 'p-009', // Prof. Hanne Mølgaard
    stage: 'in_dialogue',
    matchScore: 92,
    lastContact: '2026-05-23',
    nextStep: 'Discuss advisory-board scope',
    notes: 'Health-policy authority with Nordic payer networks — ideal for the advisory board.',
    history: [
      { id: 'a1', date: '2026-03-25', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-23', type: 'meeting', text: 'Conversation with COO Ingrid.', author: 'Ingrid Dahl' },
    ],
  },
  {
    id: 'm-051',
    companyId: 'c-lumen',
    candidateId: 'p-022', // Dr. Peter Lindgren
    stage: 'interested',
    matchScore: 85,
    lastContact: '2026-05-16',
    nextStep: 'Send advisory brief',
    notes: 'Healthtech go-to-market and investor perspective.',
    history: [
      { id: 'a1', date: '2026-04-20', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-16', type: 'call', text: 'Interested.', author: 'Emil' },
    ],
  },
  {
    id: 'm-052',
    companyId: 'c-lumen',
    candidateId: 'p-003', // Dr. Louise Winther
    stage: 'interested',
    matchScore: 78,
    lastContact: null,
    nextStep: 'Coordinate with Saga approach',
    notes: 'Also engaged with Saga — manage carefully.',
    history: [{ id: 'a1', date: '2026-05-31', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Borg & Vinter ─────────────────────────
  {
    id: 'm-060',
    companyId: 'c-borg',
    candidateId: 'p-010', // Frederik Aagaard
    stage: 'negotiation',
    matchScore: 95,
    lastContact: '2026-05-29',
    nextStep: 'Owner (Birgitte) to confirm offer',
    notes: 'Family-business governance and succession expertise is a near-perfect match.',
    history: [
      { id: 'a1', date: '2026-02-05', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-03-15', type: 'meeting', text: 'Met owner Birgitte Borg.', author: 'Birgitte Borg' },
      { id: 'a3', date: '2026-05-29', type: 'stage_change', text: 'Moved to Negotiation.', author: 'Emil' },
    ],
  },
  {
    id: 'm-061',
    companyId: 'c-borg',
    candidateId: 'p-018', // Søren Bach
    stage: 'in_dialogue',
    matchScore: 88,
    lastContact: '2026-05-20',
    nextStep: 'Second meeting',
    notes: 'Manufacturing CEO with export depth; strong operational complement.',
    history: [
      { id: 'a1', date: '2026-03-01', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-20', type: 'meeting', text: 'First interview.', author: 'Birgitte Borg' },
    ],
  },
  {
    id: 'm-062',
    companyId: 'c-borg',
    candidateId: 'p-013', // Birgit Sandberg
    stage: 'first_meeting',
    matchScore: 82,
    lastContact: '2026-05-13',
    nextStep: 'Follow up',
    notes: 'Seasoned chair with international-trade network.',
    history: [
      { id: 'a1', date: '2026-04-26', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-13', type: 'email', text: 'Sent brief.', author: 'Emil' },
    ],
  },

  // ───────────────────────── Greenfield AgriTech ─────────────────────────
  {
    id: 'm-070',
    companyId: 'c-greenfield',
    candidateId: 'p-012', // Rasmus Dahl — AgriTech CTO
    stage: 'interested',
    matchScore: 90,
    lastContact: '2026-05-17',
    nextStep: 'Intro to CEO Camilla',
    notes: 'Deep agri + AI domain knowledge; would strengthen the product narrative for fundraising.',
    history: [
      { id: 'a1', date: '2026-04-10', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-17', type: 'call', text: 'Very interested.', author: 'Emil' },
    ],
  },
  {
    id: 'm-071',
    companyId: 'c-greenfield',
    candidateId: 'p-018', // Søren Bach
    stage: 'first_meeting',
    matchScore: 79,
    lastContact: '2026-05-09',
    nextStep: 'Await reply',
    notes: 'Food-sector commercial and export experience valuable for scaling.',
    history: [
      { id: 'a1', date: '2026-04-28', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-05-09', type: 'email', text: 'Sent brief.', author: 'Emil' },
    ],
  },
  {
    id: 'm-072',
    companyId: 'c-greenfield',
    candidateId: 'p-022', // Dr. Peter Lindgren
    stage: 'interested',
    matchScore: 68,
    lastContact: null,
    nextStep: 'Assess VC fit',
    notes: 'Investor perspective for the next funding round.',
    history: [{ id: 'a1', date: '2026-06-01', type: 'created', text: 'Added to pipeline.', author: 'Emil' }],
  },

  // ───────────────────────── Tivolio (placed) ─────────────────────────
  {
    id: 'm-080',
    companyId: 'c-tivolio',
    candidateId: 'p-011', // Julie Toft
    stage: 'signed',
    matchScore: 96,
    lastContact: '2026-04-30',
    nextStep: 'Seated — first board meeting held',
    notes: 'Placed. Founder-operator with direct hospitality exit experience. Excellent outcome.',
    history: [
      { id: 'a1', date: '2025-10-15', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2025-12-02', type: 'meeting', text: 'Interview with MD Lars.', author: 'Lars Frandsen' },
      { id: 'a3', date: '2026-02-10', type: 'meeting', text: 'Final board interview.', author: 'Lars Frandsen' },
      { id: 'a4', date: '2026-03-05', type: 'stage_change', text: 'Offer accepted.', author: 'Emil' },
    ],
  },
  {
    id: 'm-081',
    companyId: 'c-tivolio',
    candidateId: 'p-025', // Ida Lindberg
    stage: 'not_relevant',
    matchScore: 81,
    lastContact: '2026-02-20',
    nextStep: null,
    notes: 'Strong candidate but seat filled by Julie Toft. Keep warm for future brand-led mandates.',
    history: [
      { id: 'a1', date: '2025-11-10', type: 'created', text: 'Added to pipeline.', author: 'Emil' },
      { id: 'a2', date: '2026-02-20', type: 'stage_change', text: 'Not selected — seat filled.', author: 'Emil' },
    ],
  },
]

export const matchesForCompany = (companyId: string): Match[] =>
  mockMatches.filter((m) => m.companyId === companyId)

export const matchesForCandidate = (candidateId: string): Match[] =>
  mockMatches.filter((m) => m.candidateId === candidateId)
