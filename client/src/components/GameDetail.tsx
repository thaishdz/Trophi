import { useGame } from '../hooks/useGame'
import { useGamePalette } from '../hooks/useGamePalette'
import { useFollowedAchievements } from '../hooks/useFollowedAchievements'
import { progressColor } from '../lib/progress'
import { summarize } from '../lib/searchHistory'
import { Achievement } from '../types/game'
import GameCover from './GameCover'

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
    <div className="rounded-2xl border border-(--p-line) bg-black/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-0.5 font-display text-3xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

type RowProps = {
  achievement: Achievement
  following: boolean
  onToggle: () => void
}

function AchievementRow({ achievement, following, onToggle }: RowProps) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-(--p-line) bg-(--p-surface) p-3.5">
      <img
        src={achievement.icon} alt="" loading="lazy"
        className="h-14 w-14 shrink-0 rounded-xl bg-black/40 object-cover grayscale opacity-80"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight">{achievement.name}</p>
        <p className="mt-0.5 text-sm text-muted text-pretty">
          {achievement.description || 'Logro oculto'}
        </p>
      </div>
      <button
        type="button"
        aria-pressed={following}
        aria-label={`${following ? 'Dejar de seguir' : 'Seguir'} ${achievement.name}`}
        onClick={onToggle}
        className={`shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
          following
            ? 'border-(--p-accent) bg-(--p-accent) text-black'
            : 'border-(--p-line) text-text hover:border-(--p-accent) hover:text-(--p-accent)'
        }`}
      >
        {following ? 'Siguiendo' : 'Seguir'}
      </button>
    </li>
  )
}

type ListProps = {
  items: Achievement[]
  followed: Set<string>
  onToggle: (achievement: string) => void
}

function AchievementList({ items, followed, onToggle }: ListProps) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
      {items.map((a) => (<AchievementRow key={a.value} achievement={a} following={followed.has(a.value)} onToggle={() => onToggle(a.value)} />))}
    </ul>
  )
}

function GameDetail({ gameId }: { gameId: number }) {
  const { data: game, isPending, error } = useGame(gameId)
  const palette = useGamePalette(game && summarize(game))
  const { followed, toggle, failed } = useFollowedAchievements(gameId)
  // The locked achievements are split in two sections. A followed achievement may have been
  // unlocked since, so only the ones still locked show up as followed.
  const achievements = game?.achievements ?? []
  const following = achievements.filter((a) => followed.has(a.value))
  const pending = achievements.filter((a) => !followed.has(a.value))

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

      <a href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text">
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
                <h1 className="font-display text-5xl font-bold leading-[0.92] tracking-tight text-balance sm:text-7xl">
                  {game.gameName}
                </h1>
                {total > 0 && (
                  <div className="mt-6 max-w-xl">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-display text-5xl font-bold tabular-nums" style={{ color }}>{pct}%</span>
                      <span className="text-muted">{unlocked} de {total}</span>
                    </div>
                    <ProgressBar value={pct} color={color} />
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Stat label="Pendientes" value={locked} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {failed && (
            <p role="alert" className="mt-10 text-sm text-muted">No se pudo actualizar el seguimiento. Inténtalo de nuevo.</p>
          )}

          {locked > 0 && (
            <section aria-labelledby="following-achievements" className="mt-12">
              <h2 id="following-achievements" className="font-display text-3xl font-semibold">
                Siguiendo <span className="text-muted">({following.length})</span>
              </h2>
              {following.length ? (
                <AchievementList items={following} followed={followed} onToggle={toggle} />
              ) : (
                <p className="mt-3 text-muted">Sigue un logro pendiente y aparecerá aquí.</p>
              )}
            </section>
          )}

          <section aria-labelledby="locked-achievements" className="mt-12">
            <h2 id="locked-achievements" className="font-display text-3xl font-semibold">
              Logros pendientes <span className="text-muted">({pending.length})</span>
            </h2>
            {pending.length ? (
              <AchievementList items={pending} followed={followed} onToggle={toggle} />
            ) : (
              <p className="mt-3 text-muted">
                {locked ? 'Estás siguiendo todos los logros pendientes.' : total ? '¡Lo tienes todo! No queda ningún logro por desbloquear.' : 'Este juego no tiene logros.'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default GameDetail
