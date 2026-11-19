import { useState } from 'react'
import { LinkKind, useAchievementLinks } from '../hooks/useAchievementLinks'

// What changes between the guides and the videos sections; the behaviour is the same
const COPY: Record<LinkKind, {
  heading: string
  add: string
  noun: string // "la guía" / "el vídeo"
  thisOne: string // "esta guía" / "este vídeo"
  empty: string
  titlePlaceholder: string
  urlPlaceholder: string
}> = {
  guides: {
    heading: 'Guías',
    add: 'Añadir guía',
    noun: 'la guía',
    thisOne: 'esta guía',
    empty: 'Aún no has guardado ninguna guía para este logro.',
    titlePlaceholder: 'Guía de la comunidad',
    urlPlaceholder: 'https://…',
  },
  videos: {
    heading: 'Vídeos',
    add: 'Añadir vídeo',
    noun: 'el vídeo',
    thisOne: 'este vídeo',
    empty: 'Aún no has guardado ningún vídeo para este logro.',
    titlePlaceholder: 'Vídeo del logro',
    urlPlaceholder: 'https://www.youtube.com/watch?v=…',
  },
}

export function ExternalLinkCard({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-2xl border border-(--p-line) bg-(--p-surface) p-4 transition-colors hover:border-(--p-accent)"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        <span className="block truncate text-sm text-muted">{hint}</span>
      </span>
      <span aria-hidden="true" className="text-muted">↗</span>
      <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
  )
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

type Props = {
  kind: LinkKind
  gameId: number
  achievement: string // apiname
  search: { href: string; label: string } // ready-made search shown under the list
}

// A list of links the user saved for an achievement, with a form to add one and a two-step delete
function SavedLinksSection({ kind, gameId, achievement, search }: Props) {
  const copy = COPY[kind]
  const links = useAchievementLinks(kind, gameId, achievement)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  // Id of the link waiting for the user to confirm its deletion
  const [confirming, setConfirming] = useState<string | null>(null)

  const headingId = `achievement-${kind}`
  const close = () => {
    setAdding(false)
    setTitle('')
    setUrl('')
    links.add.reset()
  }

  const inputClass = 'w-full rounded-xl border border-(--p-line) bg-black/30 px-3 py-2 text-text placeholder:text-muted focus:border-(--p-accent) focus:outline-none'

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="font-display text-3xl font-semibold">{copy.heading}</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="cursor-pointer rounded-full border border-(--p-line) px-4 py-1.5 text-sm font-semibold transition-colors hover:border-(--p-accent) hover:text-(--p-accent)"
          >
            + {copy.add}
          </button>
        )}
      </div>

      {adding && (
        <form
          className="mt-4 grid gap-3 rounded-2xl border border-(--p-line) bg-(--p-surface) p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            links.add.mutate({ title: title.trim(), url: url.trim() }, { onSuccess: close })
          }}
        >
          <label className="text-sm font-semibold">
            Enlace
            <input
              type="url" required autoFocus value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder={copy.urlPlaceholder} maxLength={2000} className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-sm font-semibold">
            Título <span className="font-normal text-muted">(opcional)</span>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.titlePlaceholder} maxLength={200} className={`mt-1 ${inputClass}`}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit" disabled={links.add.isPending}
              className="cursor-pointer rounded-full border border-(--p-accent) bg-(--p-accent) px-4 py-2 text-sm font-semibold text-black disabled:cursor-wait disabled:opacity-60"
            >
              {links.add.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={close} className="cursor-pointer px-2 text-sm font-semibold text-muted hover:text-text">
              Cancelar
            </button>
          </div>
          {links.add.isError && (
            <p role="alert" className="text-sm text-muted sm:col-span-3">No se pudo guardar {copy.noun}. Revisa el enlace e inténtalo de nuevo.</p>
          )}
        </form>
      )}

      {links.isPending && <p className="mt-3 text-muted" role="status">Cargando…</p>}
      {links.error && <p className="mt-3 text-muted" role="alert">{links.error.message}</p>}
      {links.data && (
        links.data.length ? (
          <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {links.data.map((link) => {
              const removing = links.remove.isPending && links.remove.variables === link.id
              return (
                <li key={link.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <ExternalLinkCard href={link.url} label={link.title} hint={hostOf(link.url)} />
                  </div>
                  {/* Deleting takes two clicks: the first one only asks for confirmation */}
                  {confirming === link.id ? (
                    <div role="group" aria-label={`Confirmar borrado de ${link.title}`} className="flex shrink-0 items-center gap-2 text-sm">
                      <span className="hidden text-muted sm:inline">¿Borrar {copy.thisOne}?</span>
                      <button
                        type="button"
                        autoFocus
                        disabled={removing}
                        onClick={() => links.remove.mutate(link.id, { onSettled: () => setConfirming(null) })}
                        className="cursor-pointer rounded-full border border-red-400 bg-red-400 px-3 py-1.5 font-semibold text-black disabled:cursor-wait disabled:opacity-60"
                      >
                        {removing ? 'Borrando…' : 'Borrar'}
                      </button>
                      <button
                        type="button"
                        disabled={removing}
                        onClick={() => setConfirming(null)}
                        className="cursor-pointer px-1 font-semibold text-muted hover:text-text"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(link.id)}
                      aria-label={`Borrar ${copy.noun} ${link.title}`}
                      title={`Borrar ${copy.noun}`}
                      className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-(--p-line) text-muted transition-colors hover:border-(--p-accent) hover:text-(--p-accent)"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          !adding && <p className="mt-3 text-muted">{copy.empty}</p>
        )
      )}
      {links.remove.isError && (
        <p role="alert" className="mt-3 text-sm text-muted">No se pudo borrar {copy.noun}. Inténtalo de nuevo.</p>
      )}

      <a
        href={search.href} target="_blank" rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-(--p-accent)"
      >
        {search.label} <span aria-hidden="true">↗</span>
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </a>
    </section>
  )
}

export default SavedLinksSection
