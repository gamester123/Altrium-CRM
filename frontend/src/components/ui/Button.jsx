const VARIANTS = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
}
const SIZES = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm' }
export default function Button({ variant='primary', size='md', busy=false, busyLabel, children, className='', disabled, ...rest }) {
  return <button disabled={disabled || busy} className={`rounded-[11px] font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...rest}>{busy ? busyLabel || 'Working…' : children}</button>
}
