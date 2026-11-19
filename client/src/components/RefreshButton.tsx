import { useEffect, useState } from 'react'
import { timeAgo } from '../lib/relativeTime'

type Props = {
  syncedAt?: string
  onRefresh: () => void
  pending: boolean
  failed: boolean
  label: string // what is refreshed, for screen readers ("la biblioteca", "los logros")
}

// Shows how old the data is and lets the user ask Steam again. The button stays disabled while a refresh is running.
function RefreshButton({ syncedAt, onRefresh, pending, failed, label }: Props) {
  // Re-render every minute so "hace X minutos" does not freeze
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      {syncedAt && <span>Actualizado {timeAgo(syncedAt)}</span>}
      <button
        type="button"
        onClick={onRefresh}
        disabled={pending}
        aria-label={`Actualizar ${label}`}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-(--p-line) px-3 py-1 font-semibold text-text transition-colors hover:border-(--p-accent) hover:text-(--p-accent) disabled:cursor-wait disabled:opacity-60"
      >
        <svg
          aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${pending ? 'animate-spin motion-reduce:animate-none' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v5h-5" />
        </svg>
        {pending ? 'Actualizando…' : 'Actualizar'}
      </button>
      {failed && !pending && (
        <span role="alert">No se pudo actualizar desde Steam. Inténtalo de nuevo.</span>
      )}
    </div>
  )
}

export default RefreshButton
