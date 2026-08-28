import { useEffect } from 'react'

const VARIANTS = {
  success: 'bg-signal text-white',
  error: 'bg-hot text-white',
}

/**
 * Controlled toast — parent owns the { message, variant } state and passes
 * null to hide it. Auto-dismisses itself after `duration`.
 *
 * <Toast toast={toast} onDismiss={() => setToast(null)} />
 */
export default function Toast({ toast, onDismiss, duration = 2500 }) {
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(onDismiss, duration)
    return () => clearTimeout(id)
  }, [toast, onDismiss, duration])

  if (!toast) return null

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${VARIANTS[toast.variant] || VARIANTS.success}`}
    >
      {toast.message}
    </div>
  )
}
