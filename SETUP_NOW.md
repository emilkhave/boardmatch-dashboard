# 🏖️ Kom-i-gang, når du er tilbage fra stranden

Alt koden, GitHub, Vercel-projektet og automatiseringen er **klar**. Der er kun to ting
tilbage, som kræver dine egne logins (jeg kan ikke oprette konti eller godkende OAuth for dig).
Følg dette — det tager ~10 minutter, og det meste er copy-paste.

**Live site (kører allerede i demo-tilstand):**
👉 https://boardmatch-dashboard-beta.vercel.app

---

## Trin 0 — Forbered én fil (30 sek)

I projektmappen (`Dash Hatch`), i terminalen:

```bash
cp .env.example .env.local
```

Du udfylder `.env.local` undervejs nedenfor. Den er gitignored — hemmelighederne
havner aldrig på GitHub.

---

## Trin 1 — Supabase (database + logins) · ~4 min

1. Gå til **https://supabase.com** → log ind → **New project**.
   - Organization: din egen. Region: **Central EU (Frankfurt)**. Sæt et database-password
     (gem det et sikkert sted — du bruger det sjældent). Klik **Create** (~1 min at oprette).
2. Når projektet er klar: **SQL Editor → New query**. Åbn filen
   [`supabase/schema.sql`](supabase/schema.sql) i projektet, kopiér **hele** indholdet ind,
   klik **Run**. (Du skal se "Success".)
3. **Authentication → Providers → Email** → slå **"Confirm email" OFF** → Save.
   (Så virker logins med det samme, uden bekræftelses-mail.)
4. **Project Settings → API** → kopiér disse tre og skriv dem ind i `.env.local`:

   | I Supabase hedder det | I `.env.local` (to steder for URL'en) |
   |---|---|
   | **Project URL** | `VITE_SUPABASE_URL=` **og** `SUPABASE_URL=` (samme værdi) |
   | **anon public** key (starter `eyJ…`) | `VITE_SUPABASE_ANON_KEY=` |
   | **service_role** key (den hemmelige) | `SUPABASE_SERVICE_ROLE_KEY=` |

5. Vælg et admin-password og skriv det i `.env.local`:
   ```
   ADMIN_PASSWORD=dit-stærke-password-her
   ```
   (`VITE_ADMIN_EMAILS` er allerede sat til `have@thehatchpartners.com` — det er din admin-login.)

➡️ **Nu kan du køre den ene kommando** (den sætter alt i Vercel, opretter din admin-bruger og
redeployer):

```bash
node scripts/setup.mjs
```

Når den er færdig: gå til https://boardmatch-dashboard-beta.vercel.app → **Sign in** med
`have@thehatchpartners.com` + dit admin-password → du er inde som admin. 🎉
Dine kunder kan nu selv oprette sig via **Create account** (de bliver automatisk "virksomhed").

> Du behøver ikke Zoho for at logge ind — spring til det senere hvis du vil.

---

## Trin 2 — Zoho (kandidat-sync) · ~3 min · valgfri, kan gøres senere

Du sagde du "kun vil indtaste API". Her er den absolut korteste vej — du henter tre værdier
og et hjælpe-script laver resten.

1. **https://api-console.zoho.eu** (brug `.eu` hvis din Zoho er europæisk; ellers `.com`).
   → **Add Client → Self Client → Create**. Kopiér **Client ID** og **Client Secret**.
2. Samme sted → fanen **Generate Code**:
   - **Scope:** `ZohoCRM.modules.ALL,ZohoCRM.settings.fields.READ`
   - **Duration:** 10 minutes · Scope Description: hvad som helst · **Create**
   - Kopiér **grant code** (starter `1000.…`). Den udløber hurtigt — gå direkte videre.
3. I terminalen (indsæt dine tre værdier):
   ```bash
   node scripts/zoho-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET> <GRANT_CODE>
   ```
   Den printer tre linjer (`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`).
   Kopiér dem ind i `.env.local`.
4. Sæt hvilket Zoho-modul dine kandidater ligger i (i `.env.local`):
   - Standard CRM: `ZOHO_MODULE=Leads` eller `ZOHO_MODULE=Contacts`
   - Dit eget "Members"-modul: `ZOHO_MODULE=Members` (find det præcise API-navn under
     Zoho → Setup → Modules and Fields).
5. Kør igen:
   ```bash
   node scripts/setup.mjs
   ```

**Test Zoho virker** (uden at ændre data) — du skal først sætte et `ZOHO_TEST_TOKEN` i
`.env.local` (vælg selv en tilfældig streng) og køre `setup.mjs`. Så:
```
https://boardmatch-dashboard-beta.vercel.app/api/zoho-test?email=EN-DER-FINDES-I-ZOHO&token=DIT_ZOHO_TEST_TOKEN
```
Får du personens data tilbage, virker forbindelsen. Importér så alle kandidater:
```
https://boardmatch-dashboard-beta.vercel.app/api/zoho-sync?token=DIT_ZOHO_TEST_TOKEN
```

---

## Trin 3 — (Anbefalet) Auto-deploy fra GitHub · 1 min

Så hvert `git push` auto-deployer, uden CLI:

1. Log ind på **https://vercel.com** → **Settings → Connections** (eller **Login Connections**)
   → **Connect GitHub** → godkend.
2. Åbn projektet **boardmatch-dashboard** → **Settings → Git** → **Connect Git Repository** →
   vælg **emilkhave/boardmatch-dashboard** → **main**.

Indtil du gør det, deployer jeg (Claude) fra CLI, hvilket også virker fint.

---

## Hvad er allerede gjort for dig

- ✅ Repo forket til **emilkhave/boardmatch-dashboard** (du er ejer), koden pushet.
- ✅ Vercel-projekt oprettet + første deploy live: **boardmatch-dashboard-beta.vercel.app**
- ✅ `VITE_ADMIN_EMAILS` sat i Vercel (din email = admin).
- ✅ Sikkerhed rettet: kun din email bliver admin; kunder kan ikke gøre sig selv til admin.
- ✅ Database-skema klar (`supabase/schema.sql`), env-skabelon (`.env.example`).
- ✅ Ét-kommando-opsætning (`scripts/setup.mjs`) + Zoho-token-hjælper
  (`scripts/zoho-refresh-token.mjs`).

## Hvis noget driller
- `node scripts/setup.mjs` fejler på Vercel-delen → kør `vercel login` én gang og prøv igen.
- Login virker ikke → tjek at `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` er sat og at du
  redeployede (setup-scriptet gør det automatisk).
- `/api/candidates` viser `configured:false` → `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  mangler i Vercel; kør `setup.mjs` igen.
