export default function DataTable({ columns, rows, rowKey, loading=false, empty='Nothing here yet.', page, total, limit=20, onPageChange }) {
  const paged = typeof page === 'number' && typeof total === 'number' && onPageChange
  const lastPage = paged ? Math.max(1, Math.ceil(total / limit)) : 1
  const from = paged && total > 0 ? (page - 1) * limit + 1 : 0
  const to = paged ? Math.min(page * limit, total) : 0
  return <div className="crm-card overflow-hidden">
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-slate-100 text-left">{columns.map(col => <th key={col.key} className="px-5 py-4 text-[10px] font-bold uppercase tracking-[.15em]">{col.header}</th>)}</tr></thead>
      <tbody>
        {loading && <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-400">Loading records…</td></tr>}
        {!loading && rows.length === 0 && <tr><td colSpan={columns.length} className="px-5 py-16 text-center"><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">—</div><div className="text-sm font-medium text-slate-700">{empty}</div><div className="mt-1 text-xs text-slate-400">Try adjusting your search or filters.</div></td></tr>}
        {!loading && rows.map(row => <tr key={rowKey(row)} className="border-b border-slate-100 last:border-0">{columns.map(col => <td key={col.key} className={`px-4 py-4 align-middle ${col.className || 'text-slate-800'}`}>{col.render ? col.render(row) : row[col.key]}</td>)}</tr>)}
      </tbody>
    </table></div>
    {paged && <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-400 tabular">{total === 0 ? 'No records' : `Showing ${from}–${to} of ${total}`}</p><div className="flex items-center gap-2"><button type="button" onClick={() => onPageChange(page-1)} disabled={page<=1 || loading} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-30 hover:bg-slate-50">Previous</button><span className="px-2 text-xs font-medium text-slate-500 tabular">{page} / {lastPage}</span><button type="button" onClick={() => onPageChange(page+1)} disabled={page>=lastPage || loading} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-30 hover:bg-slate-50">Next</button></div></div>}
  </div>
}
