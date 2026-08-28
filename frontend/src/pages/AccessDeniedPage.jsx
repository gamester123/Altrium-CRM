import { Link } from 'react-router-dom'

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-paper text-center px-6">
      <div className="max-w-sm space-y-4">
        <p className="font-mono text-xs uppercase tracking-wide text-hot">403 · Access denied</p>
        <h1 className="font-display text-2xl font-semibold text-ink">This record isn't yours to open</h1>
        <p className="text-ink/50 text-sm">
          It belongs to another user. Ask your manager if you need access to it.
        </p>
        <Link to="/dashboard" className="inline-block text-signal font-medium text-sm hover:underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}