// Dashboard colors derived from a game's cover, so each game tints the screen

export type Palette = {
  bg: string       // page background
  glow: string     // soft light at the top of the page
  surface: string  // capsules and tiles
  line: string     // borders
  accent: string   // progress and highlights
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function paletteFromHsl(h: number, s: number): Palette {
  const muted = clamp(s * 0.55, 14, 42)
  return {
    bg: `hsl(${h} ${muted}% 6%)`,
    glow: `hsl(${h} ${clamp(s, 35, 75)}% 19%)`,
    surface: `hsl(${h} ${muted}% 11% / 0.8)`,
    line: `hsl(${h} ${muted}% 21%)`,
    accent: `hsl(${h} ${clamp(s, 60, 90)}% 58%)`,
  }
}

// Used before any game is picked, and for covers with no dominant color
export const DEFAULT_PALETTE = paletteFromHsl(24, 70)

const cache = new Map<string, Palette | null>()

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

function samplePalette(img: HTMLImageElement): Palette | null {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size) // throws if the canvas is tainted

  // Hue is circular, so average it as a vector. Saturated mid-tone pixels weigh more.
  let x = 0, y = 0, sat = 0, total = 0
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    const weight = s * (1 - Math.abs(2 * l - 1))
    x += Math.cos((h * Math.PI) / 180) * weight
    y += Math.sin((h * Math.PI) / 180) * weight
    sat += s * weight
    total += weight
  }
  if (total < 1) return null
  const avgSat = (sat / total) * 100
  if (avgSat < 15) return null // grayscale cover: keep the default palette
  const hue = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return paletteFromHsl(Math.round(hue), avgSat)
}

function load(url: string): Promise<Palette | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // the Steam CDN allows it; without it the canvas would be tainted
    img.onload = () => {
      try {
        resolve(samplePalette(img))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export async function extractPalette(urls: (string | undefined)[]): Promise<Palette | null> {
  for (const url of urls) {
    if (!url) continue
    if (!cache.has(url)) cache.set(url, await load(url))
    const palette = cache.get(url)
    if (palette) return palette
  }
  return null
}
