# Zoho integration — exact setup guide

When someone clicks an **Interested** link and enters **first name, last name, email**, the
backend looks them up in Zoho by email, pulls their **real** data, and creates them in both
Emil's dashboard and the company's dashboard.

You need to do **3 things**: (A) add a database, (B) connect Zoho, (C) set the secrets in Vercel.
All secrets live in **Vercel Environment Variables** — encrypted at rest, only available to the
server functions, **never** sent to the browser. No one can read them from the website.

> After changing any environment variable you must **redeploy** for it to take effect.

---

## A. Add the shared database (Supabase — free)

This is where candidates/matches are stored so both dashboards see the same data.

1. Sign up at **https://supabase.com** → **New project** (pick region **Central EU (Frankfurt)**,
   set a database password, create — takes ~1 min to provision).
2. Open the project → **SQL Editor → New query**, paste this and click **Run**:

   ```sql
   create table if not exists candidates (
     id text primary key,
     data jsonb not null,
     created_at timestamptz default now()
   );
   create table if not exists matches (
     id text primary key,
     data jsonb not null,
     created_at timestamptz default now()
   );
   ```
3. Get your keys: **Project Settings → API** → copy the **Project URL** and the
   **`service_role`** key (the secret one — *not* the `anon` key).

Then either give those two values to me (I'll set them in Vercel for you), **or** add them yourself
in **Vercel → project → Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | the Project URL (e.g. `https://abcd.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` secret key |

✅ Test (after a redeploy): `https://boardmatch-dashboard.vercel.app/api/candidates` should return
`{"configured":true,"candidates":[],"matches":[]}`.

> The `service_role` key bypasses row-level security and is server-only — keep it in Vercel env
> vars, never in the frontend.

---

## B. Connect Zoho (OAuth — get a refresh token)

### B1. Create a Self Client
1. Go to **https://api-console.zoho.eu** (use `.eu` for a European Zoho account; `.com` if US).
2. **Add Client → Self Client → Create**. Note the **Client ID** and **Client Secret**.

### B2. Generate a grant code
1. Still in the Self Client, open the **Generate Code** tab.
2. **Scope:** `ZohoCRM.modules.ALL,ZohoCRM.settings.fields.READ`
3. **Time duration:** 10 minutes. **Scope Description:** anything. Click **Create**.
4. Copy the **grant code** (starts with `1000.…`). It expires fast — do step B3 right away.

### B3. Exchange the grant code for a refresh token
Run this in a terminal (replace the 3 values). Use `accounts.zoho.eu` for EU:

```bash
curl -X POST "https://accounts.zoho.eu/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=PASTE_GRANT_CODE"
```

The response contains a **`refresh_token`** (starts with `1000.…`). **This is the long-lived
secret** — copy it. (The `access_token` is short-lived; the server regenerates it automatically.)

### B4. Find your module + field names
- **Module API name:** Zoho → Setup → Developer Space → **APIs** (or the URL of your records).
  In your screenshot it's the **Members** custom module → API name is usually `Members`
  (sometimes `CustomModuleN`). If you're using standard CRM, it's `Leads` or `Contacts`.
- **Field API names:** Zoho → Setup → Customization → **Modules and Fields → (your module) →**
  each field shows its **API Name**. The email field is usually `Email`.

The backend already maps common field names (Title, LinkedIn, Mobile, Competencies, Industries,
Partner_Description, Advisory_Experiences, City, Country). If your API names differ, set the
optional `ZOHO_FIELD_MAP` variable (see below).

---

## C. Set the secrets in Vercel

**Vercel → project → Settings → Environment Variables** → add these (Production + Preview):

| Name | Value | Required |
|------|-------|----------|
| `ZOHO_CLIENT_ID` | from B1 | ✅ |
| `ZOHO_CLIENT_SECRET` | from B1 | ✅ |
| `ZOHO_REFRESH_TOKEN` | from B3 | ✅ |
| `ZOHO_ACCOUNTS_DOMAIN` | `https://accounts.zoho.eu` | only if not EU |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.eu` | only if not EU |
| `ZOHO_MODULE` | e.g. `Members` (or `Leads`) | ✅ if not `Leads` |
| `ZOHO_EMAIL_FIELD` | `Email` | only if different |
| `ZOHO_FIELD_MAP` | JSON, see below | optional |

`ZOHO_FIELD_MAP` example (only if your API names differ from the defaults):
```json
{"name":["Member_Name"],"bio":["Partner_Description"],"boardExperience":["Advisory_Experiences_Text"],"competencies":["Competencies"],"sectors":["Industries"]}
```

Then **Deployments → ⋯ on the latest → Redeploy** (or push any commit).

> The `SUPABASE_*` variables from step A must also be present (you add them, or I do).

---

## D. Test it end-to-end

1. In Emil's dashboard → **Intake & Zoho** → copy a company's **landing link**
   (e.g. `https://boardmatch-dashboard.vercel.app/apply/c-nordlys`).
2. Open it, enter the **first name, last name and the email of a person that exists in Zoho**,
   click **I'm interested**.
3. That person now appears (with their real Zoho data) in the **Interested** column of that
   company's pipeline **and** in Emil's pipeline (dashboards refresh every ~30s, or reload).

### Quick checks
- `GET /api/candidates` → `{"configured":true,…}` means the DB is connected.
- After a submit, `GET /api/candidates` shows the new candidate/match.
- If a person isn't found in Zoho, they're still created from the form data (so nothing is lost),
  just without the enriched Zoho fields.

---

## E. Authentication — real logins (Supabase Auth)

Accounts, passwords and sessions use **Supabase Auth** (same Supabase project as the database).

1. **Disable email confirmation** (so accounts work instantly): Supabase → **Authentication →
   Providers → Email** → turn **"Confirm email" OFF** → Save. (Leave on if you want email
   verification, but then new users must confirm before their first sign-in.)
2. **Get the public client keys**: Supabase → **Settings → API** → copy the **Project URL** and the
   **`anon` public** key (the JWT starting `eyJ…` — *not* `service_role`).
3. Set these in **Vercel → Settings → Environment Variables** (they are baked into the browser
   build, so **redeploy** after setting them):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | the `anon` public key |

Until these are set the app falls back to a demo sign-in; once set, the login screen offers
**Sign in / Create account** (Company or Admin). The `anon` key is public by design — security
comes from Supabase Auth + row-level security, not from hiding it.

## Full environment-variable summary

| Variable | Where | Secret? |
|----------|-------|---------|
| `SUPABASE_URL` | Vercel (server) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server) | **YES** |
| `VITE_SUPABASE_URL` | Vercel (client build) | no |
| `VITE_SUPABASE_ANON_KEY` | Vercel (client build) | no (public) |
| `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET` / `ZOHO_REFRESH_TOKEN` | Vercel (server) | **YES** |
| `ZOHO_MODULE` (`Contacts`), `ZOHO_EMAIL_FIELD` (`Email`) | Vercel (server) | no |
| `ZOHO_TEST_TOKEN` | Vercel (server) | keep private |

## Security notes
- Secrets are **only** in Vercel env vars (encrypted, server-side). They are never in the
  frontend bundle, the Git repo, or the browser. Never prefix them with `VITE_`.
- Rotate the refresh token any time by repeating B2–B3 and updating `ZOHO_REFRESH_TOKEN`.
- The landing page is intentionally public (it's a form). It can only *create* interest; it
  cannot read your CRM.
