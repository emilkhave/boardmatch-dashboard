# Zoho integration — exact setup guide

When someone clicks an **Interested** link and enters **first name, last name, email**, the
backend looks them up in Zoho by email, pulls their **real** data, and creates them in both
Emil's dashboard and the company's dashboard.

You need to do **3 things**: (A) add a database, (B) connect Zoho, (C) set the secrets in Vercel.
All secrets live in **Vercel Environment Variables** — encrypted at rest, only available to the
server functions, **never** sent to the browser. No one can read them from the website.

> After changing any environment variable you must **redeploy** for it to take effect.

---

## A. Add the shared database (Upstash Redis — free)

This is where candidates/matches are stored so both dashboards see the same data.

1. Go to **Vercel → your project `boardmatch-dashboard` → Storage → Create Database**.
2. Choose **Upstash → Redis** (Marketplace), pick the region **eu-west-1 (Ireland)**, create it.
3. When asked, **Connect** it to the `boardmatch-dashboard` project (all environments).

That's it — Vercel automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
(or `KV_REST_API_URL` / `KV_REST_API_TOKEN`). The code accepts either pair.

✅ Test: open `https://boardmatch-dashboard.vercel.app/api/candidates` — it should return
`{"configured":true,"candidates":[],"matches":[]}` after a redeploy.

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

> Upstash/KV variables from step A are added automatically — you don't set those by hand.

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

## Security notes
- Secrets are **only** in Vercel env vars (encrypted, server-side). They are never in the
  frontend bundle, the Git repo, or the browser. Never prefix them with `VITE_`.
- Rotate the refresh token any time by repeating B2–B3 and updating `ZOHO_REFRESH_TOKEN`.
- The landing page is intentionally public (it's a form). It can only *create* interest; it
  cannot read your CRM.
