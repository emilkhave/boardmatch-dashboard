#!/usr/bin/env node
// One-command configurator for BoardMatch.
//
//   node scripts/setup.mjs
//
// It reads .env.local, then:
//   1. Pushes every provided variable to Vercel (production + preview + development).
//   2. Creates your admin user in Supabase (so you can just sign in).
//   3. Redeploys the site to production.
//
// You only need to fill in .env.local first (copy it from .env.example).
// Re-running is safe — it overwrites existing values.

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

// ── tiny .env parser ─────────────────────────────────────────────────────────
function loadEnv(path) {
  if (!existsSync(path)) {
    fail(`Missing ${path}. Copy the template first:\n\n  cp .env.example .env.local\n\nthen fill in your keys and re-run.`)
  }
  const out = {}
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function fail(msg) {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}
const ok = (m) => console.log(`✅ ${m}`)
const info = (m) => console.log(`   ${m}`)

// ── Vercel env vars ──────────────────────────────────────────────────────────
// Only variables that belong in Vercel. ADMIN_PASSWORD is used locally (below),
// never uploaded.
const VERCEL_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ADMIN_EMAILS',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ZOHO_CLIENT_ID',
  'ZOHO_CLIENT_SECRET',
  'ZOHO_REFRESH_TOKEN',
  'ZOHO_ACCOUNTS_DOMAIN',
  'ZOHO_API_DOMAIN',
  'ZOHO_MODULE',
  'ZOHO_EMAIL_FIELD',
  'ZOHO_FIELD_MAP',
  'ZOHO_TEST_TOKEN',
]
const ENVIRONMENTS = ['production', 'preview', 'development']

function vercel(args, input) {
  return execFileSync('vercel', args, {
    cwd: root,
    input: input ?? '',
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function setVercelVar(name, value) {
  for (const env of ENVIRONMENTS) {
    // Remove any existing value first (ignore "not found").
    try {
      vercel(['env', 'rm', name, env, '--yes'])
    } catch {
      /* not set yet — fine */
    }
    vercel(['env', 'add', name, env], value)
  }
}

// ── Supabase admin user ──────────────────────────────────────────────────────
async function createAdminUser(env) {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  const email = (env.VITE_ADMIN_EMAILS || '').split(',')[0].trim()
  const password = env.ADMIN_PASSWORD
  if (!url || !key) return info('Skipping admin user — SUPABASE_URL / SERVICE_ROLE_KEY not set.')
  if (!email) return info('Skipping admin user — VITE_ADMIN_EMAILS not set.')
  if (!password) return info('Skipping admin user — ADMIN_PASSWORD not set in .env.local.')

  const r = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const body = await r.json().catch(() => ({}))
  if (r.ok) return ok(`Admin user created: ${email}`)
  const msg = (body?.msg || body?.message || '').toLowerCase()
  if (r.status === 422 || msg.includes('already') || msg.includes('registered')) {
    return ok(`Admin user already exists: ${email} (left as-is)`)
  }
  info(`⚠️  Could not create admin user (${r.status}): ${JSON.stringify(body)}`)
}

// ── run ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 BoardMatch setup\n')
  const env = loadEnv(envPath)

  // 1) Vercel env vars
  const provided = VERCEL_VARS.filter((k) => env[k] && env[k].trim() !== '')
  if (provided.length) {
    console.log('Pushing env vars to Vercel (production, preview, development)…')
    for (const name of provided) {
      setVercelVar(name, env[name])
      info(`set ${name}`)
    }
    ok(`${provided.length} variable(s) set in Vercel.`)
  } else {
    info('No Vercel variables found in .env.local — skipping that step.')
  }

  // 2) Supabase admin user
  console.log('\nCreating your admin login in Supabase…')
  await createAdminUser(env)

  // 3) Redeploy
  console.log('\nRedeploying to production…')
  try {
    const out = vercel(['deploy', '--prod', '--yes'])
    const line = out.trim().split('\n').filter(Boolean).pop()
    ok(`Deployed. ${line || ''}`)
  } catch (e) {
    info(`⚠️  Deploy step failed — run it manually:  vercel deploy --prod --yes\n${e.message}`)
  }

  console.log('\n🎉 Done. Open https://boardmatch-dashboard-beta.vercel.app and sign in.\n')
}

main().catch((e) => fail(e.stack || String(e)))
