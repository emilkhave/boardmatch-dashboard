// Vercel Serverless Function — Zoho inbound webhook (prototype stub).
//
// Zoho (CRM Workflow → Webhook, or Notifications API) POSTs candidate-record
// changes here. In production this handler would:
//   1. Verify a shared secret / Zoho signature.
//   2. Map the Zoho record → { company, candidate, "Interested" stage }.
//   3. Upsert it into the database the dashboards read from.
//   4. Optionally write back to Zoho on later stage changes (two-way sync).
//
// For now it accepts the call and acknowledges, so the webhook can be wired and
// tested from Zoho immediately. GET returns a small status for easy browser checks.

export const config = { runtime: 'nodejs' }

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      service: 'boardmatch-zoho-webhook',
      message: 'Ready. Send Zoho candidate changes here via POST.',
    })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  // TODO(production): verify `req.headers['x-zoho-signature']` / a shared secret.
  const payload = req.body ?? {}

  // TODO(production): upsert candidate + create/refresh an "Interested" match in
  // the persistent store; the dashboards then reflect it. Logged for now.
  console.log('Zoho webhook received:', JSON.stringify(payload).slice(0, 2000))

  res.status(200).json({ ok: true, received: true })
}
