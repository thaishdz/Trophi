import { useState } from 'react'
import { GameSummary } from '../lib/searchHistory'

type Props = {
  game: GameSummary
  className?: string
}

// Vertical cover first, then the horizontal header, then a placeholder
function GameCover({ game, className = '' }: Props) {
  const [failed, setFailed] = useState(0)
  const sources = [game.cover, game.coverFallback].filter(Boolean) as string[]
  const src = sources[failed]

  if (!src) {
    return (
      <div aria-hidden="true" className={`grid place-items-center bg-black/40 text-muted ${className}`}>
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h4m-2 -2v4" />
          <line x1="15" y1="11" x2="15" y2="11.01" />
          <line x1="18" y1="13" x2="18" y2="13.01" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed((n) => n + 1)}
      className={`object-cover ${className}`}
    />
  )
}

export default GameCover
