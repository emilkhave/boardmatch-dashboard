// ---------------------------------------------------------------------------
// Brand theming helpers.
// Turn a company's brand color into a full accent scale (CSS variables) and
// resolve a logo from the company's website domain.
// ---------------------------------------------------------------------------

import type { CSSProperties } from 'react'

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h || '000000', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function mix([r, g, b]: number[], [tr, tg, tb]: number[], ratio: number): [number, number, number] {
  return [r + (tr - r) * ratio, g + (tg - g) * ratio, b + (tb - b) * ratio]
}

const WHITE = [255, 255, 255]
const BLACK = [0, 0, 0]

// Steps tuned so 50–200 read as light chips, 400–600 as accents/buttons,
// 700–900 as the dark banner/text — matching how the UI already uses accent-*.
const STEPS: { key: number; target: number[]; ratio: number }[] = [
  { key: 50, target: WHITE, ratio: 0.92 },
  { key: 100, target: WHITE, ratio: 0.84 },
  { key: 200, target: WHITE, ratio: 0.68 },
  { key: 300, target: WHITE, ratio: 0.48 },
  { key: 400, target: WHITE, ratio: 0.26 },
  { key: 500, target: WHITE, ratio: 0.12 },
  { key: 600, target: BLACK, ratio: 0.0 },
  { key: 700, target: BLACK, ratio: 0.14 },
  { key: 800, target: BLACK, ratio: 0.28 },
  { key: 900, target: BLACK, ratio: 0.4 },
]

// Build the `--accent-*` CSS variables for a given brand color, as a React
// style object that can be applied to a wrapper element.
export function brandThemeVars(brandHex: string): CSSProperties {
  const base = hexToRgb(brandHex)
  const vars: Record<string, string> = {}
  for (const s of STEPS) {
    const [r, g, b] = mix(base, s.target, s.ratio)
    vars[`--accent-${s.key}`] = `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`
  }
  return vars as CSSProperties
}

// Extract a clean domain from a possibly-messy website string.
export function domainFromWebsite(website?: string): string | null {
  if (!website) return null
  let w = website.trim().toLowerCase()
  w = w.replace(/^https?:\/\//, '').replace(/^www\./, '')
  w = w.split('/')[0].split('?')[0].split('#')[0]
  return /\.[a-z]{2,}$/.test(w) ? w : null
}

// Candidate logo URLs for a domain, in order of preference.
export function logoCandidates(domain: string): string[] {
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
  ]
}

export function primaryLogoUrl(website?: string): string | undefined {
  const d = domainFromWebsite(website)
  return d ? logoCandidates(d)[0] : undefined
}

// Best-effort dominant-color extraction from a logo image. Returns null if the
// image is cross-origin tainted (common) — callers fall back to a derived color.
export function extractBrandColor(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        const buckets = new Map<string, { n: number; r: number; g: number; b: number; sat: number }>()
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 128) continue
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          if (max > 238 && min > 238) continue // near-white
          if (max < 18) continue // near-black
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
        if (!buckets.size) return resolve(null)
        // Prefer frequent, reasonably saturated colors.
        let best: { score: number; r: number; g: number; b: number } | null = null
        for (const v of buckets.values()) {
          const score = v.n * (0.4 + v.sat)
          if (!best || score > best.score) best = { score, r: v.r / v.n, g: v.g / v.n, b: v.b / v.n }
        }
        resolve(best ? rgbToHex(best.r, best.g, best.b) : null)
      } catch {
        resolve(null) // CORS-tainted canvas
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Deterministic, pleasant fallback color derived from the domain name.
const FALLBACK_PALETTE = ['#27534b', '#2563eb', '#7c3aed', '#be123c', '#b45309', '#0f766e', '#4338ca']
export function colorFromDomain(domain: string): string {
  let h = 0
  for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) >>> 0
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length]
}

// Resolve a brand color + logo for a website: try to read the logo's color,
// otherwise derive one from the domain.
export async function resolveBrand(
  website: string,
): Promise<{ brandColor: string; logoUrl?: string; domain: string } | null> {
  const domain = domainFromWebsite(website)
  if (!domain) return null
  const logos = logoCandidates(domain)
  let brandColor: string | null = null
  for (const url of logos) {
    brandColor = await extractBrandColor(url)
    if (brandColor) break
  }
  return {
    domain,
    logoUrl: logos[0],
    brandColor: brandColor ?? colorFromDomain(domain),
  }
}
