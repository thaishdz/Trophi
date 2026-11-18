// Color scale for completion percentages, tuned for dark surfaces.
// Discrete tiers read faster than a gradient; green is reserved for 100%.
const TIERS: { min: number; color: string }[] = [
  { min: 100, color: '#3ecf8e' }, // completed
  { min: 75, color: '#b5d65a' },  // almost there
  { min: 50, color: '#e8c04a' },  // halfway
  { min: 25, color: '#f0884a' },  // started
  { min: 0, color: '#e5646a' },   // barely touched
]

export function progressColor(percent: number): string {
  return (TIERS.find((tier) => percent >= tier.min) ?? TIERS[TIERS.length - 1]).color
}
