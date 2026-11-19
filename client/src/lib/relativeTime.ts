const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

// "hace 3 minutos", "hace 2 horas", "ayer"; under a minute it is "ahora mismo"
export function timeAgo(iso: string, now = Date.now()): string {
  const elapsed = now - new Date(iso).getTime()
  for (const [unit, ms] of UNITS) {
    if (elapsed >= ms) return rtf.format(-Math.floor(elapsed / ms), unit)
  }
  return 'ahora mismo'
}
