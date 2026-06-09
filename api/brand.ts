// GET /api/brand?domain=acme.com — resolve a company's logo + brand color
// SERVER-SIDE (no browser CORS limits, unlike the client-only fallback).
//
// Strategy:
//   1. Fetch the site HTML; read <meta name="theme-color"> and the best icon
//      (apple-touch-icon → og:image → icon link).
//   2. Logo URL: the meta icon, else a high-res favicon service.
//   3. Brand color: theme-color if present, else the dominant color of the logo
//      (decoded with sharp), else a deterministic fallback from the domain.

export const config = { runtime: 'nodejs' }

function cleanDomain(input?: string): string | null {
  if (!input) return null
  let w = String(input).trim().toLowerCase()
  w = w.replace(/^https?:\/\//, '').replace(/^www\./, '')
  w = w.split('/')[0].split('?')[0].split('#')[0]
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(w) ? w : null
}

const PALETTE = ['#27534b', '#2563eb', '#7c3aed', '#be123c', '#b45309', '#0f766e', '#4338ca']
function colorFromDomain(domain: string): string {
  let h = 0
  for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

async function fetchText(url: string, ms = 6000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BoardMatchBot/1.0)' },
    })
    return await r.text()
  } finally {
    clearTimeout(t)
  }
}

function absolute(href: string, base: string): string {
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return m ? m[1] : null
}

function normalizeHex(c?: string | null): string | null {
  if (!c) return null
  const v = c.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v
  const m = v.match(/rgb\(\s*(\d+)\D+(\d+)\D+(\d+)/i)
  if (m) {
    const hex = (n: string) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0')
    return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
  }
  return null
}

// Prefer the actual square logo icon (apple-touch-icon / favicon) over og:image,
// which is usually a marketing banner. Returns absolute URLs in priority order.
function logoUrls(html: string, base: string, domain: string): string[] {
  const links = html.match(/<link[^>]+>/gi) || []
  const metas = html.match(/<meta[^>]+>/gi) || []
  const out: string[] = []
  const add = (href: string | null) => {
    if (href) out.push(absolute(href, base))
  }

  for (const l of links) if (/rel\s*=\s*["'][^"']*apple-touch-icon/i.test(l)) add(attr(l, 'href'))
  // <link rel="icon"> — prefer larger sizes first.
  const icons = links
    .filter((l) => /rel\s*=\s*["'][^"']*icon/i.test(l) && !/apple-touch-icon/i.test(l))
    .sort((a, b) => sizeOf(b) - sizeOf(a))
  for (const i of icons) add(attr(i, 'href'))
  const og = metas.find((m) => /property\s*=\s*["']og:image/i.test(m))
  if (og) add(attr(og, 'content'))
  out.push(`https://www.google.com/s2/favicons?sz=256&domain=${domain}`)
  return out.filter((v, i, a) => a.indexOf(v) === i)
}

function sizeOf(tag: string): number {
  const s = attr(tag, 'sizes')
  if (!s) return 0
  const m = s.match(/(\d+)x\d+/)
  return m ? parseInt(m[1], 10) : 0
}

function pickThemeColor(html: string): string | null {
  const metas = html.match(/<meta[^>]+>/gi) || []
  const theme = metas.find((m) => /name\s*=\s*["']theme-color["']/i.test(m))
  if (theme) {
    const c = normalizeHex(attr(theme, 'content'))
    if (c) return c
  }
  const tile = metas.find((m) => /name\s*=\s*["']msapplication-TileColor["']/i.test(m))
  if (tile) return normalizeHex(attr(tile, 'content'))
  return null
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')

// Dominant *brand* color from a logo: decode raw pixels (server-side, no CORS),
// ignore transparent / near-white / near-black, and weight by saturation so the
// accent color wins over background.
async function logoBrandColor(url: string): Promise<{ hex: string; sat: number } | null> {
  try {
    const sharp = (await import('sharp')).default
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const resp = await fetch(url, { signal: ctrl.signal, redirect: 'follow' }).finally(() => clearTimeout(t))
    if (!resp.ok) return null
    const input = Buffer.from(await resp.arrayBuffer())
    const { data } = await sharp(input)
      .ensureAlpha()
      .resize(64, 64, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const buckets = new Map<string, { n: number; r: number; g: number; b: number; sat: number }>()
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 128) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      if (max > 240 && min > 240) continue // near-white
      if (max < 22) continue // near-black
      const sat = max === 0 ? 0 : (max - min) / max
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`
      const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, sat: 0 }
      cur.n++
      cur.r += r
      cur.g += g
      cur.b += b
      cur.sat = Math.max(cur.sat, sat)
      buckets.set(key, cur)
    }
    if (!buckets.size) return null
    let best: { score: number; r: number; g: number; b: number; sat: number } | null = null
    for (const v of buckets.values()) {
      const score = v.n * (0.35 + v.sat * 1.5)
      if (!best || score > best.score) best = { score, r: v.r / v.n, g: v.g / v.n, b: v.b / v.n, sat: v.sat }
    }
    if (!best) return null
    return { hex: `#${toHex(best.r)}${toHex(best.g)}${toHex(best.b)}`, sat: best.sat }
  } catch {
    return null
  }
}

function saturation(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

// Reject near-white/near-black "colors" that aren't really a brand color.
function isUsable(hex: string): boolean {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max > 240 && min > 240) return false
  if (max < 18) return false
  return true
}

export default async function handler(req: any, res: any) {
  const domain = cleanDomain(req.query?.domain || req.query?.website)
  if (!domain) {
    res.status(400).json({ ok: false, error: 'Provide ?domain=' })
    return
  }

  const base = `https://${domain}`
  let html = ''
  try {
    html = await fetchText(base)
  } catch {
    /* site unreachable — fall back below */
  }

  const candidates = html
    ? logoUrls(html, base, domain)
    : [`https://www.google.com/s2/favicons?sz=256&domain=${domain}`]
  const logoUrl = candidates[0]
  const themeColor = html ? pickThemeColor(html) : null

  // Read the brand color from the actual logo icon.
  const fromLogo = await logoBrandColor(logoUrl)

  // Choose: a saturated logo color beats a greyish theme-color; otherwise prefer
  // a usable theme-color; otherwise the logo color; otherwise a domain fallback.
  let brandColor: string
  if (fromLogo && fromLogo.sat >= 0.25 && isUsable(fromLogo.hex)) {
    brandColor = fromLogo.hex
  } else if (themeColor && isUsable(themeColor) && saturation(themeColor) >= 0.18) {
    brandColor = themeColor
  } else if (fromLogo && isUsable(fromLogo.hex)) {
    brandColor = fromLogo.hex
  } else if (themeColor && isUsable(themeColor)) {
    brandColor = themeColor
  } else {
    brandColor = colorFromDomain(domain)
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
  res.status(200).json({ ok: true, domain, logoUrl, brandColor })
}
