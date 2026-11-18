import { useQuery } from '@tanstack/react-query'
import { API_URL } from '../config'
import { useGamePalette } from '../hooks/useGamePalette'
import { progressColor } from '../lib/progress'
import { summarize } from '../lib/searchHistory'
import { GameData, Achievement } from '../types/game'
import GameCover from './GameCover'

async function fetchGame(gameId: number): Promise<GameData> {
  const res = await fetch(`${API_URL}gameAchievements/${gameId}`, { credentials: 'include' })
  const result = await res.json().catch(() => null)
  if (!res.ok || !result?.success) throw new Error(result?.message || 'No se pudieron cargar los logros')
  return result.data
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-black/40"
    >
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-(--p-line) bg-(--p-surface) px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-(--p-line) bg-(--p-surface) p-3.5">
      <img
        src={achievement.icon} alt="" loading="lazy"
        className="h-14 w-14 shrink-0 rounded-xl bg-black/40 object-cover grayscale opacity-80"
      />
      <div className="min-w-0">
        <p className="font-semibold leading-tight">{achievement.name}</p>
        <p className="mt-0.5 text-sm text-muted text-pretty">
          {achievement.description || 'Logro oculto'}
        </p>
      </div>
    </li>
  )
}

function GameDetail({ gameId }: { gameId: number }) {
  const { data: game, isPending, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGame(gameId),
    staleTime: 5 * 60 * 1000, // same cooldown the server applies per (user, game)
  })
  const palette = useGamePalette(game && summarize(game))

  const total = game?.totalGameAchievements ?? 0
  const locked = game?.achievements.length ?? 0
  const unlocked = total - locked
  const pct = total ? Math.round((unlocked / total) * 100) : 0
  const color = progressColor(pct)
  const headerImage = game?.coverFallback ?? game?.cover

  return (
    <div
      className="text-text"
      style={{ '--p-line': palette.line, '--p-surface': palette.surface, '--p-accent': palette.accent } as React.CSSProperties}
    >
      <div
        aria-hidden="true" className="fixed inset-0 -z-10"
        style={{ background: `radial-gradient(ellipse 80% 55% at 70% 0%, ${palette.glow}, transparent 70%), ${palette.bg}` }}
      />

      <a href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text sm:mt-10">
        <span aria-hidden="true">←</span> Volver al dashboard
      </a>

      {isPending && <p className="mt-10 text-muted" role="status">Cargando logros…</p>}
      {error && (
        <p className="mt-10 rounded-2xl border border-dashed border-(--p-line) px-6 py-10 text-center" role="alert">
          {error.message}
        </p>
      )}

      {game && (
        <>
          <section className="relative isolate mt-4 overflow-hidden rounded-[2rem] border border-(--p-line) bg-(--p-surface)">
            {headerImage && (
              <img
                src={headerImage} alt="" aria-hidden="true"
                className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-40 sm:w-3/5 [mask-image:linear-gradient(to_left,black,transparent)]"
              />
            )}
            <div className="flex flex-wrap items-end gap-x-10 gap-y-6 p-6 sm:p-12">
              <GameCover game={summarize(game)} className="aspect-[2/3] w-36 rounded-2xl shadow-2xl shadow-black/50 sm:w-56" />
              <div className="min-w-0 flex-1 basis-72">
                <span
                  className="inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color, borderColor: color }}
                >
                  {!total ? 'Sin logros' : pct === 100 ? 'Completado' : 'En progreso'}
                </span>
                <h1 className="mt-3 font-display text-5xl font-bold leading-[0.92] tracking-tight text-balance sm:text-7xl">
                  {game.gameName}
                </h1>
                {total > 0 && (
                  <div className="mt-6 max-w-md">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-display text-5xl font-bold tabular-nums" style={{ color }}>{pct}%</span>
                      <span className="text-muted">{unlocked} de {total}</span>
                    </div>
                    <ProgressBar value={pct} color={color} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {total > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
              <Stat label="Conseguidos" value={unlocked} />
              <Stat label="Pendientes" value={locked} />
              <Stat label="Total" value={total} />
            </div>
          )}

          <section aria-labelledby="locked-achievements" className="mt-12">
            <h2 id="locked-achievements" className="font-display text-3xl font-semibold">
              Logros pendientes <span className="text-muted">({locked})</span>
            </h2>
            {locked ? (
              <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {game.achievements.map((a) => (<AchievementRow key={a.name} achievement={a} />))}
              </ul>
            ) : (
              <p className="mt-3 text-muted">
                {total ? '¡Lo tienes todo! No queda ningún logro por desbloquear.' : 'Este juego no tiene logros.'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default GameDetail
