#!/usr/bin/env node
// Turns a Zoho "grant code" into a long-lived refresh token.
//
//   node scripts/zoho-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET> <GRANT_CODE> [dc]
//
//   dc = data center suffix: eu (default), com, in, com.au, jp
//
// Grant codes expire fast (you set ~10 min in Zoho) — run this right after
// generating one. It prints the ZOHO_REFRESH_TOKEN you paste into .env.local.
//
// How to get the three inputs (2 minutes, see SETUP_NOW.md for screenshots-level detail):
//   1. https://api-console.zoho.eu  →  Add Client  →  Self Client  →  Create.
//      Copy the Client ID and Client Secret.
//   2. In that Self Client → "Generate Code" tab:
//        Scope:    ZohoCRM.modules.ALL,ZohoCRM.settings.fields.READ
//        Duration: 10 minutes
//      Create → copy the grant code (starts with 1000.…).
//   3. Run this script with those three values.

const [clientId, clientSecret, grantCode, dcArg] = process.argv.slice(2)

if (!clientId || !clientSecret || !grantCode) {
  console.error(
    '\nUsage:\n  node scripts/zoho-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET> <GRANT_CODE> [eu|com|in|com.au|jp]\n',
  )
  process.exit(1)
}

const dc = (dcArg || 'eu').replace(/^\./, '')
const accountsDomain = `https://accounts.zoho.${dc}`
const apiDomain = `https://www.zohoapis.${dc}`

const params = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: clientId,
  client_secret: clientSecret,
  code: grantCode,
})

const res = await fetch(`${accountsDomain}/oauth/v2/token?${params.toString()}`, { method: 'POST' })
const json = await res.json().catch(() => ({}))

if (!json.refresh_token) {
  console.error('\n❌ No refresh token returned. Zoho said:\n')
  console.error(JSON.stringify(json, null, 2))
  console.error(
    '\nMost common cause: the grant code expired or was already used — generate a fresh one and re-run immediately.',
  )
  console.error('Also confirm the data center (eu/com/…) matches your Zoho account.\n')
  process.exit(1)
}

console.log('\n✅ Success! Add these to .env.local:\n')
console.log(`ZOHO_CLIENT_ID=${clientId}`)
console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`)
console.log(`ZOHO_REFRESH_TOKEN=${json.refresh_token}`)
if (dc !== 'eu') {
  console.log(`ZOHO_ACCOUNTS_DOMAIN=${accountsDomain}`)
  console.log(`ZOHO_API_DOMAIN=${apiDomain}`)
}
console.log('\nThen run:  node scripts/setup.mjs\n')
