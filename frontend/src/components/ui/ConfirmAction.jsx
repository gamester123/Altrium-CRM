import { useState } from 'react'
import Button from './Button'

export default function ConfirmAction({
  label = 'Delete',
  confirmLabel = 'Confirm',
  message,
  onConfirm,
  disabled = false,
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (disabled) return <span className="text-xs text-ink/30">—</span>

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-ink/50 hover:text-hot transition"
      >
        {label}
      </button>
    )
  }

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-1">
      {message && <p className="text-xs text-ink/60">{message}</p>}
      <div className="flex items-center gap-2">
        <Button variant="danger" size="sm" busy={busy} busyLabel="Working…" onClick={confirm}>
          {confirmLabel}
        </Button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-ink/50 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
