export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen grid place-items-center bg-paper">
      <p className="text-ink/60 text-sm">{label}</p>
    </div>
  )
}