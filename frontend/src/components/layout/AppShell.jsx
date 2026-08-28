import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleGate from '../../auth/RoleGate'
import { ROLES } from '../../auth/roles'
import RoleBadge from '../ui/RoleBadge'

const nav = [
  { to: '/dashboard', label: 'Overview', icon: 'grid' },
  { to: '/companies', label: 'Companies', icon: 'building' },
  { to: '/pipeline', label: 'Pipeline', icon: 'kanban' },
  { to: '/leads', label: 'Leads', icon: 'users' },
]

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 8h3a2 2 0 0 1 2 2v11"/><path d="M8 7h4M8 11h4M8 15h4M8 19h4M19 14h1M19 18h1"/></>,
    kanban: <><path d="M4 5h6v10H4zM14 5h6v6h-6zM14 15h6v4h-6z"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

const linkClass = ({ isActive }) => `group nav-link relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'nav-active bg-white/[.08] text-white' : 'text-slate-400 hover:bg-white/[.05] hover:text-white'}`

export default function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)
  return (
    <div className="crm-shell min-h-screen bg-[#f6f8fb] text-slate-900">
      <aside className="crm-sidebar fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-white/5 bg-[#0c1320] px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2 pb-9">
          <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-emerald-300 to-cyan-300 text-[15px] font-extrabold text-[#0c1320] shadow-lg shadow-emerald-300/10">A</div>
          <div><div className="font-display text-[17px] font-semibold tracking-tight text-white">Altrium</div><div className="text-[9px] uppercase tracking-[.22em] text-slate-500">CRM workspace</div></div>
        </div>
        <div className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace</div>
        <nav className="space-y-1">
          {nav.map((item) => <NavLink key={item.to} to={item.to} onClick={closeMobile} className={linkClass}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
          <RoleGate allow={[ROLES.ADMIN]}><NavLink to="/admin/users" onClick={closeMobile} className={linkClass}><Icon name="shield" /><span>User management</span></NavLink></RoleGate>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.035] p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 text-sm font-bold text-slate-900">{(user?.name || 'U').slice(0,1).toUpperCase()}</div>
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</div><div className="truncate text-[11px] text-slate-500">{user?.email || ''}</div></div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/[.07] pt-3">
            {user?.role && <RoleBadge role={user.role} />}
            <button onClick={logout} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"><Icon name="logout" size={15}/> Sign out</button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" type="button" className="crm-mobile-overlay lg:hidden" onClick={closeMobile} />}
      <aside className={`crm-mobile-drawer lg:hidden ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="flex items-center justify-between px-2 pb-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-emerald-300 to-cyan-300 text-[15px] font-extrabold text-[#0c1320]">A</div>
            <div><div className="font-display text-[17px] font-semibold tracking-tight text-white">Altrium</div><div className="text-[9px] uppercase tracking-[.22em] text-slate-500">CRM workspace</div></div>
          </div>
          <button type="button" aria-label="Close navigation" onClick={closeMobile} className="crm-mobile-close">×</button>
        </div>
        <div className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace</div>
        <nav className="space-y-1">
          {nav.map((item) => <NavLink key={item.to} to={item.to} onClick={closeMobile} className={linkClass}><Icon name={item.icon} /><span>{item.label}</span></NavLink>)}
          <RoleGate allow={[ROLES.ADMIN]}><NavLink to="/admin/users" onClick={closeMobile} className={linkClass}><Icon name="shield" /><span>User management</span></NavLink></RoleGate>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.035] p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 text-sm font-bold text-slate-900">{(user?.name || 'U').slice(0,1).toUpperCase()}</div>
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</div><div className="truncate text-[11px] text-slate-500">{user?.email || ''}</div></div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/[.07] pt-3">
            {user?.role && <RoleBadge role={user.role} />}
            <button onClick={() => { closeMobile(); logout() }} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"><Icon name="logout" size={15}/> Sign out</button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="crm-hamburger">
              <span></span><span></span><span></span>
            </button>
            <div className="hidden sm:grid lg:hidden h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">A</div>
            <div className="hidden lg:block"><div className="text-[11px] font-semibold uppercase tracking-[.15em] text-slate-400">Sales workspace</div><div className="mt-0.5 text-sm font-medium text-slate-700">Customer operations</div></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Workspace online</div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 lg:hidden">{(user?.name || 'U').slice(0,1).toUpperCase()}</div>
          </div>
        </header>
        <main className="crm-main px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
      </div>
    </div>
  )
}
