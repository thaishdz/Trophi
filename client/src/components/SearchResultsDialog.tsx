import { useEffect, useRef } from 'react'
import { GameData } from '../types/game'
import GameRow from './GameRow'

type Props = {
  open: boolean
  games: GameData[]
  onClose: () => void
}

// Search results in a native modal <dialog>: it already handles focus, Esc, the backdrop
// and returning the focus to the search box. Opening and closing follow the `open` prop.
function SearchResultsDialog({ open, games, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // closedby="any" gives click-outside dismissal; browsers without it (Safari) get this fallback
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return
    // The pointer position is tested, not event.target, because the dialog is also the
    // target of its own padding
    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }
    let pressedOutside = false
    const down = (e: PointerEvent) => { pressedOutside = outside(e) }
    const up = (e: PointerEvent) => { if (pressedOutside && outside(e)) dialog.close() }
    dialog.addEventListener('pointerdown', down)
    dialog.addEventListener('pointerup', up)
    return () => {
      dialog.removeEventListener('pointerdown', down)
      dialog.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <dialog
      ref={ref}
      {...({ closedby: 'any' } as object)}
      aria-labelledby="search-results-title"
      onClose={onClose}
      className="m-auto max-h-[85vh] w-[min(42rem,92vw)] overflow-y-auto rounded-3xl border border-(--p-line) bg-panel p-5 text-text sm:p-8 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="search-results-title" className="font-display text-3xl font-semibold">
          Resultados <span className="text-muted">({games.length})</span>
        </h2>
        <form method="dialog">
          <button
            type="submit"
            aria-label="Cerrar resultados"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-(--p-line) text-text hover:border-(--p-accent) hover:text-(--p-accent)"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </form>
      </div>

      {games.length ? (
        <ul className="mt-6 flex flex-col gap-3">
          {games.map((game) => (<GameRow key={game.gameId} game={game} />))}
        </ul>
      ) : (
        <p className="mt-6 text-muted">No hay juegos de tu biblioteca que coincidan con la búsqueda.</p>
      )}
    </dialog>
  )
}

export default SearchResultsDialog
