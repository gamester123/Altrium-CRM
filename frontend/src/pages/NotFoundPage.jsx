import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-paper text-center px-6">
      <div className="max-w-sm space-y-4">
        <p className="font-mono text-xs uppercase tracking-wide text-ink/40">404 · Not found</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Nothing here</h1>
        <p className="text-ink/50 text-sm">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block text-signal font-medium text-sm hover:underline">
          Go home
        </Link>
      </div>
    </main>
  )
}