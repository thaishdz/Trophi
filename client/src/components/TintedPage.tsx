import { CSSProperties, ReactNode } from 'react'
import { useGamePalette } from '../hooks/useGamePalette'
import { GameSummary } from '../lib/searchHistory'

// Shared look of every screen after login: a dark page tinted with the colours of a game's cover.
// It exposes the palette as --p-line, --p-surface and --p-accent for the page content.
function TintedPage({ game, children }: { game: GameSummary | undefined; children: ReactNode }) {
  const palette = useGamePalette(game)

  return (
    <div
      className="text-text"
      style={{ '--p-line': palette.line, '--p-surface': palette.surface, '--p-accent': palette.accent } as CSSProperties}
    >
      {/* Full-viewport tint behind the page; the sidebar sits above it */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 55% at 70% 0%, ${palette.glow}, transparent 70%), ${palette.bg}` }}
      />
      {children}
    </div>
  )
}

export default TintedPage
