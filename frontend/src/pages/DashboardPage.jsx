import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listDeals } from '../api/deals'
import { listCompanies } from '../api/companies'
import { listLeads } from '../api/leads'
import RoleBadge from '../components/ui/RoleBadge'

const money = (n) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n || 0)

function StatCard({ label, value, hint, icon, tone = 'emerald' }) {
  return <div className="crm-card relative overflow-hidden p-5">
    <div className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl ${tone === 'blue' ? 'bg-blue-50 text-blue-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{icon}</div>
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{hint}</p>
  </div>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ companies: 0, leads: 0, deals: 0, value: 0 })

  useEffect(() => {
    Promise.allSettled([
      listCompanies({ page: 1, limit: 1 }),
      listLeads(),
      listDeals(),
    ]).then(([companies, leads, deals]) => {
      const dealRows = deals.status === 'fulfilled' ? (deals.value?.data || []) : []
      setStats({
        companies: companies.status === 'fulfilled' ? (companies.value?.total ?? companies.value?.data?.length ?? 0) : 0,
        leads: leads.status === 'fulfilled' ? (leads.value?.total ?? leads.value?.data?.length ?? 0) : 0,
        deals: dealRows.length,
        value: dealRows.reduce((sum, d) => sum + Number(d.value || 0), 0),
      })
    })
  }, [])

  return (
    <section className="mx-auto max-w-[1400px] space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Good evening</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">A quick view of your customer relationships, active pipeline and sales momentum.</p>
        </div>
        {user?.role && <RoleBadge role={user.role} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Companies" value={stats.companies} hint="Customer accounts" tone="blue" icon="◈" />
        <StatCard label="Open leads" value={stats.leads} hint="Leads in your workspace" icon="↗" />
        <StatCard label="Deals" value={stats.deals} hint="Tracked opportunities" tone="amber" icon="◇" />
        <StatCard label="Pipeline value" value={money(stats.value)} hint="Across listed deals" icon="₨" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="crm-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-950">Your workspace</h2>
              <p className="mt-1 text-sm text-slate-500">Everything you need to move customer conversations forward.</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Live</div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[['Companies', 'Manage accounts and contacts'], ['Pipeline', 'Move deals through stages'], ['Leads', 'Qualify new opportunities']].map(([title, desc], i) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-4 grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-semibold text-slate-700 shadow-sm">0{i + 1}</div>
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="crm-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Account</p>
          <h2 className="mt-2 font-display text-lg font-semibold text-slate-950">Profile & access</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"><span className="text-sm text-slate-500">Name</span><span className="text-sm font-medium text-slate-900">{user?.name}</span></div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"><span className="text-sm text-slate-500">Email</span><span className="max-w-[65%] truncate text-sm font-medium text-slate-900">{user?.email}</span></div>
            <div className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">Role</span>{user?.role && <RoleBadge role={user.role} />}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
