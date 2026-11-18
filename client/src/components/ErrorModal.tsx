import { useEffect } from 'react'

type ErrorModalProps = {
  message: string | null
  onClose: () => void
}

function ErrorModal({ message, onClose }: ErrorModalProps) {
  // Close with Escape
  useEffect(() => {
    if (!message) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [message, onClose])

  if (!message) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-title"
        className="bg-panel border border-line p-6 rounded-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="error-title" className="font-display text-3xl font-semibold mb-2">Ups, algo salió mal</h2>
        <p className="text-muted mb-6">{message}</p>
        <button
          autoFocus
          className="bg-gold text-gold-ink px-4 py-2 rounded-md font-semibold cursor-pointer hover:brightness-110"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default ErrorModal
