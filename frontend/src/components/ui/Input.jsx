export default function Input({ label, id, error, className='', ...rest }) {
  const inputId = id || rest.name
  return <div className="space-y-1.5">{label && <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600">{label}</label>}<input id={inputId} aria-invalid={error?'true':undefined} className={`crm-input ${error?'border-red-300':''} ${className}`} {...rest}/>{error&&<p className="text-xs text-red-600">{error}</p>}</div>
}
