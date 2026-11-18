import { TrackedGame, useTrackGame } from '../hooks/useTrackedGames'

// Bookmark over the corner of a tile (top-right) or of a result row (also top-right, smaller). The tracked-games API
// saves the game; "save" is how the UI calls it. It is a sibling of the link, never inside it.
function SaveButton({ game, variant = 'tile' }: { game: TrackedGame; variant?: 'tile' | 'row' }) {
  const { tracked, toggle, failed } = useTrackGame(game.gameId)
  const placement = variant === 'row' ? 'right-2 top-2 h-8 w-8' : 'right-2 top-2 h-10 w-10'
  const label = tracked ? `Quitar ${game.gameName} de guardados` : `Guardar ${game.gameName}`

  return (
    <>
      <button
        type="button"
        aria-pressed={tracked}
        aria-label={label}
        title={tracked ? 'Guardado' : 'Guardar juego'}
        onClick={() => toggle(game)}
        className={`absolute ${placement} grid cursor-pointer place-items-center rounded-full border bg-black/60 backdrop-blur-sm transition-colors ${
          tracked
            ? 'border-(--p-accent) text-(--p-accent)'
            : 'border-(--p-line) text-text hover:border-(--p-accent) hover:text-(--p-accent)'
        }`}
      >
        <svg
          aria-hidden="true" viewBox="0 0 24 24" className={variant === 'row' ? 'h-4 w-4' : 'h-5 w-5'}
          fill={tracked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
        >
          <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
        </svg>
      </button>
      {failed && <p role="alert" className="absolute inset-x-2 bottom-14 rounded-md bg-black/80 px-2 py-1 text-xs">No se pudo guardar el juego. Inténtalo de nuevo.</p>}
    </>
  )
}

export default SaveButton
