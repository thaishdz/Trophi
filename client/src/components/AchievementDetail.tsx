import { useState } from 'react'
import { useGame } from '../hooks/useGame'
import { useFollowedAchievements } from '../hooks/useFollowedAchievements'
import { AchievementNote, MAX_NOTE_LENGTH, useAchievementNote } from '../hooks/useAchievementNote'
import SavedLinksSection from './SavedLinksSection'
import { summarize } from '../lib/searchHistory'
import { timeAgo } from '../lib/relativeTime'
import { Achievement } from '../types/game'
import TintedPage from './TintedPage'

// Ready-made searches on the achievement. They are plain links, so they cost no Steam API calls
const steamGuidesUrl = (gameId: number, achievement: Achievement) =>
  `https://steamcommunity.com/app/${gameId}/guides/?searchText=${encodeURIComponent(achievement.name)}&browsefilter=trend`
const youtubeUrl = (gameName: string, achievement: Achievement) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${gameName} ${achievement.name} achievement`)}`

type NoteEditorProps = {
  note: AchievementNote
  onSave: (text: string) => void
  saving: boolean
  failed: boolean
}

// Keeps a local draft; the parent remounts it (key) whenever the saved note changes
function NoteEditor({ note, onSave, saving, failed }: NoteEditorProps) {
  const [draft, setDraft] = useState(note.text)
  const dirty = draft !== note.text

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (dirty) onSave(draft)
      }}
    >
      <label htmlFor="achievement-note" className="sr-only">Tu nota sobre el logro</label>
      <textarea
        id="achievement-note"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_NOTE_LENGTH}
        rows={8}
        placeholder="Apunta lo que necesites: requisitos, pasos, dónde te quedaste…"
        className="mt-4 w-full resize-y rounded-2xl border border-(--p-line) bg-black/30 p-4 text-text placeholder:text-muted focus:border-(--p-accent) focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <button
          type="submit"
          disabled={!dirty || saving}
          className="cursor-pointer rounded-full border border-(--p-accent) bg-(--p-accent) px-4 py-1.5 font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar nota'}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={() => setDraft(note.text)}
            className="cursor-pointer font-semibold hover:text-text"
          >
            Descartar cambios
          </button>
        )}
        <span className="ml-auto tabular-nums">{draft.length}/{MAX_NOTE_LENGTH}</span>
        {!dirty && note.updatedAt && <span className="basis-full">Guardada {timeAgo(note.updatedAt)}</span>}
        {failed && !saving && <span role="alert" className="basis-full">No se pudo guardar la nota. Inténtalo de nuevo.</span>}
      </div>
    </form>
  )
}

function AchievementDetail({ gameId, achievementId }: { gameId: number; achievementId: string }) {
  const { data: game, isPending, error } = useGame(gameId)
  const { followed, toggle, failed: followFailed } = useFollowedAchievements(gameId)
  const note = useAchievementNote(gameId, achievementId)

  // The game page only lists locked achievements, so an achievement missing here was unlocked since
  const achievement = game?.achievements.find((a) => a.value === achievementId)
  const following = followed.has(achievementId)

  return (
    <TintedPage game={game && summarize(game)}>
      <a href={`/library/${gameId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text">
        <span aria-hidden="true">←</span> Volver a {game?.gameName ?? 'el juego'}
      </a>

      {isPending && <p className="mt-10 text-muted" role="status">Cargando logro…</p>}
      {error && (
        <p className="mt-10 rounded-2xl border border-dashed border-(--p-line) px-6 py-10 text-center" role="alert">
          {error.message}
        </p>
      )}

      {game && !achievement && (
        <p className="mt-10 rounded-2xl border border-dashed border-(--p-line) px-6 py-10 text-center">
          Este logro no está entre tus pendientes de {game.gameName}. Puede que ya lo hayas desbloqueado.
        </p>
      )}

      {game && achievement && (
        <>
          <section className="mt-4 flex flex-wrap items-center gap-6 rounded-[2rem] border border-(--p-line) bg-(--p-surface) p-6 sm:p-10">
            <img
              src={achievement.icon} alt=""
              className="h-24 w-24 shrink-0 rounded-2xl bg-black/40 object-cover grayscale opacity-80 sm:h-32 sm:w-32"
            />
            <div className="min-w-0 flex-1 basis-64">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">{game.gameName}</p>
              <h1 className="mt-1 font-display text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
                {achievement.name}
              </h1>
              <p className="mt-2 text-muted text-pretty">{achievement.description || 'Logro oculto'}</p>
            </div>
            <button
              type="button"
              aria-pressed={following}
              onClick={() => toggle(achievementId)}
              className={`shrink-0 cursor-pointer rounded-full border px-5 py-2 font-semibold transition-colors ${
                following
                  ? 'border-(--p-accent) bg-(--p-accent) text-black'
                  : 'border-(--p-line) text-text hover:border-(--p-accent) hover:text-(--p-accent)'
              }`}
            >
              {following ? 'Siguiendo' : 'Seguir'}
            </button>
          </section>
          {followFailed && (
            <p role="alert" className="mt-3 text-sm text-muted">No se pudo actualizar el seguimiento. Inténtalo de nuevo.</p>
          )}

          <SavedLinksSection
            kind="guides"
            gameId={gameId}
            achievement={achievement.value}
            search={{ href: steamGuidesUrl(gameId, achievement), label: 'Buscar guías en la comunidad de Steam' }}
          />

          <SavedLinksSection
            kind="videos"
            gameId={gameId}
            achievement={achievement.value}
            search={{ href: youtubeUrl(game.gameName, achievement), label: 'Buscar vídeos del logro en YouTube' }}
          />

          <section aria-labelledby="achievement-notes" className="mt-12">
            <h2 id="achievement-notes" className="font-display text-3xl font-semibold">Notas</h2>
            {note.isPending && <p className="mt-3 text-muted" role="status">Cargando nota…</p>}
            {note.error && <p className="mt-3 text-muted" role="alert">{note.error.message}</p>}
            {note.data && (
              <NoteEditor
                key={note.data.updatedAt ?? 'empty'}
                note={note.data}
                onSave={(text) => note.save.mutate(text)}
                saving={note.save.isPending}
                failed={note.save.isError}
              />
            )}
          </section>
        </>
      )}
    </TintedPage>
  )
}

export default AchievementDetail
