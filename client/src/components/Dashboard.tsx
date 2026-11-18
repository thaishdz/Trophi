import { useState } from 'react'
import ErrorModal from './ErrorModal'
import GameCover from './GameCover'
import SearchBox from './SearchBox'
import { useGamePalette } from '../hooks/useGamePalette'
import { progressColor } from '../lib/progress'
import { SearchEntry, useSearchHistory } from '../lib/searchHistory'

const percent = (unlocked: number, total: number) => (total ? Math.round((unlocked / total) * 100) : 0)

function ProgressRing({ value }: { value: number }) {
  const color = progressColor(value)
  const radius = 44
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative w-36 h-36 sm:w-48 sm:h-48 shrink-0" role="img" aria-label={`${value}% completado`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--p-line)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-5xl sm:text-6xl font-bold" style={{ color }}>{value}%</span>
    </div>
  )
}

function CurrentGame({ entry }: { entry: SearchEntry | undefined }) {
  if (!entry) {
    return (
      <section aria-label="Juego actual" className="rounded-[2rem] border border-dashed border-(--p-line) px-8 py-14 text-center">
        <p className="font-display text-4xl font-semibold">Todavía no sigues ningún juego</p>
        <p className="mt-2 text-muted">Busca uno de tu biblioteca y aparecerá aquí con tu progreso.</p>
      </section>
    )
  }

  const { game } = entry
  const pct = percent(game.unlocked, game.total)
  const headerImage = game.coverFallback ?? game.cover

  return (
    <section
      aria-label="Juego actual"
      className="relative isolate overflow-hidden rounded-[2rem] border border-(--p-line) bg-(--p-surface) transition-colors hover:border-(--p-accent)"
    >
      {headerImage && (
        <img
          src={headerImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 -z-10 h-full w-full sm:w-3/5 object-cover opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]"
        />
      )}
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6 p-6 sm:p-12">
        <GameCover game={game} className="w-36 sm:w-56 aspect-[2/3] rounded-2xl shadow-2xl shadow-black/50" />
        <div className="min-w-0 flex-1 basis-60">
          <span
            className="inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: progressColor(pct), borderColor: progressColor(pct) }}
          >
            {pct === 100 ? 'Completado' : 'En progreso'}
          </span>
          <h2 className="mt-3 font-display text-6xl sm:text-8xl font-bold leading-[0.92] tracking-tight text-balance">
            {/* Stretched link: the whole hero opens the game page */}
            <a href={`/games/${game.gameId}`} className="after:absolute after:inset-0 after:content-[''] hover:underline decoration-2 underline-offset-8">
              {game.gameName}
            </a>
          </h2>
          <p className="mt-4 text-lg text-muted">
            {game.total ? `${game.unlocked} de ${game.total} logros desbloqueados` : 'Este juego no tiene logros'}
          </p>
        </div>
        {game.total > 0 && <ProgressRing value={pct} />}
      </div>
    </section>
  )
}

function PercentPill({ value }: { value: number }) {
  const color = progressColor(value)
  return (
    <span
      className="absolute right-2.5 top-2.5 rounded-full border bg-black/60 px-2.5 py-1 text-sm font-semibold tabular-nums backdrop-blur-sm"
      style={{ color, borderColor: color }}
    >
      {value}%
    </span>
  )
}

function SearchTile({ entry }: { entry: SearchEntry }) {
  const { game } = entry
  return (
    <a
      href={`/games/${game.gameId}`}
      aria-label={`Ver logros de ${game.gameName}`}
      className="group relative isolate aspect-[3/4] overflow-hidden rounded-2xl border border-(--p-line) bg-(--p-surface) text-left cursor-pointer"
    >
      <GameCover game={game} className="absolute inset-0 -z-10 h-full w-full transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      {game.total > 0 && <PercentPill value={percent(game.unlocked, game.total)} />}
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className="font-display text-xl font-semibold leading-tight line-clamp-2">{game.gameName}</p>
      </div>
    </a>
  )
}

function Dashboard() {
  const history = useSearchHistory()
  const [error, setError] = useState<string | null>(null)
  const current = history[0]
  const palette = useGamePalette(current?.game)
  const latest = history.slice(1)

  return (
    <div
      className="text-text"
      style={{
        '--p-line': palette.line,
        '--p-surface': palette.surface,
        '--p-accent': palette.accent,
      } as React.CSSProperties}
    >
      {/* Full-viewport tint behind the page; the sidebar sits above it */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 55% at 70% 0%, ${palette.glow}, transparent 70%), ${palette.bg}` }}
      />

      <header className="mt-2 sm:mt-4 flex flex-wrap items-center gap-x-3 gap-y-4 sm:grid sm:grid-cols-[1fr_minmax(0,36rem)_1fr]">
        <h1 className="order-1 flex-1 font-display text-4xl sm:order-none sm:text-5xl font-bold tracking-tight">Dashboard</h1>
        <SearchBox className="order-3 w-full sm:order-none" onSearchResults={() => {}} onError={setError} />
      </header>
      <ErrorModal message={error} onClose={() => setError(null)} />

      <div className="mt-10 sm:mt-14 flex flex-col gap-12">
        <CurrentGame entry={current} />

        <section aria-labelledby="latest-searches">
          <h2 id="latest-searches" className="font-display text-3xl font-semibold">Últimas búsquedas</h2>
          {latest.length ? (
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,11rem))] gap-4">
              {latest.map((entry) => (<SearchTile key={entry.game.gameId} entry={entry} />))}
            </div>
          ) : (
            <p className="mt-3 text-muted">Tus búsquedas anteriores aparecerán aquí.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default Dashboard
