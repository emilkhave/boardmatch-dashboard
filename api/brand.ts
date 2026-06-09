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

function pickLogo(html: string, base: string): string | null {
  const links = html.match(/<link[^>]+>/gi) || []
  const metas = html.match(/<meta[^>]+>/gi) || []

  const apple = links.find((l) => /rel\s*=\s*["'][^"']*apple-touch-icon/i.test(l))
  if (apple) {
    const href = attr(apple, 'href')
    if (href) return absolute(href, base)
  }
  const og = metas.find((m) => /property\s*=\s*["']og:image/i.test(m))
  if (og) {
    const c = attr(og, 'content')
    if (c) return absolute(c, base)
  }
  // Highest-res <link rel="icon"> we can find.
  const icons = links.filter((l) => /rel\s*=\s*["'][^"']*icon/i.test(l))
  if (icons.length) {
    const href = attr(icons[0], 'href')
    if (href) return absolute(href, base)
  }
  return null
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

async function dominantColor(url: string): Promise<string | null> {
  try {
    const sharp = (await import('sharp')).default
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const resp = await fetch(url, { signal: ctrl.signal, redirect: 'follow' }).finally(() => clearTimeout(t))
    if (!resp.ok) return null
    const buf = Buffer.from(await resp.arrayBuffer())
    const { dominant } = await sharp(buf).stats()
    if (!dominant) return null
    const hex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
    return `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`
  } catch {
    return null
  }
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
  const fallbackLogo = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
  let logoUrl = fallbackLogo
  let brandColor: string | null = null

  let html = ''
  try {
    html = await fetchText(base)
  } catch {
    /* site unreachable — fall back below */
  }

  if (html) {
    const metaLogo = pickLogo(html, base)
    if (metaLogo) logoUrl = metaLogo
    brandColor = pickThemeColor(html)
  }

  if (!brandColor || !isUsable(brandColor)) {
    const fromLogo = await dominantColor(logoUrl)
    if (fromLogo && isUsable(fromLogo)) brandColor = fromLogo
  }

  if (!brandColor || !isUsable(brandColor)) brandColor = colorFromDomain(domain)

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
  res.status(200).json({ ok: true, domain, logoUrl, brandColor })
}
