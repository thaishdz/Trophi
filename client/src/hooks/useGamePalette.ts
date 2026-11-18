import { useEffect, useState } from 'react'
import { DEFAULT_PALETTE, extractPalette, Palette } from '../lib/palette'
import { GameSummary } from '../lib/searchHistory'

export function useGamePalette(game: GameSummary | undefined): Palette {
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE)
  const cover = game?.cover
  const coverFallback = game?.coverFallback

  useEffect(() => {
    let cancelled = false
    extractPalette([cover, coverFallback]).then((result) => {
      if (!cancelled) setPalette(result ?? DEFAULT_PALETTE)
    })
    return () => { cancelled = true }
  }, [cover, coverFallback])

  return palette
}
