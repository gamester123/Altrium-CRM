import { useEffect } from 'react'
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => { if (!open) return; const onKey=e=>e.key==='Escape'&&onClose(); document.addEventListener('keydown',onKey); return()=>document.removeEventListener('keydown',onKey) }, [open,onClose])
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" onClick={onClose}/><div role="dialog" aria-modal="true" aria-label={title} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,.22)]"><div className="mb-6 flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-emerald-600">CRM action</p><h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-slate-950">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200">✕</button></div>{children}</div></div>
}
