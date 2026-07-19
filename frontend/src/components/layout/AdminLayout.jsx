import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ADMIN_NAV = [
  { to: '/admin',           label: 'Dashboard',     icon: '⬡', end: true },
  { to: '/admin/students',  label: 'Students',       icon: '◉' },
  { to: '/admin/tests',     label: 'All Tests',      icon: '✎' },
  { to: '/admin/papers',    label: 'Manage Papers',  icon: '◈' },
  { to: '/admin/live-tests',label: 'Live Quiz',      icon: '🔴' },
  { to: '/admin/settings',  label: 'Settings',       icon: '⚙' },
];

const BOTTOM_ADMIN_ITEMS = [
  { to: '/admin',          label: 'Home',    icon: '⬡', end: true },
  { to: '/admin/students', label: 'Students',icon: '◉' },
  { to: '/admin/tests',    label: 'Tests',   icon: '✎' },
  { to: '/admin/papers',   label: 'Papers',  icon: '◈' },
  { to: '/dashboard',      label: '← App',   icon: '↩' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--clr-bg)' }}>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar${drawerOpen ? ' is-open' : ''}`}
        style={{
          width: 220, flexShrink: 0,
          background: 'var(--clr-surface)',
          borderRight: '1px solid var(--clr-border)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--clr-border)' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17,
            color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              background: '#f59e0b', color: '#000', borderRadius: 7,
              width: 28, height: 28, display: 'grid', placeItems: 'center',
              fontSize: 13, fontWeight: 900,
            }}>A</span>
            Admin Panel
          </div>
          <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>NEET PG Platform</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ADMIN_NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setDrawerOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: isActive ? '#fff' : 'var(--clr-text-muted)',
                background: isActive ? '#f59e0b' : 'transparent',
                textDecoration: 'none', transition: 'all .15s',
              })}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>{label}
            </NavLink>
          ))}

          {/* Back to student view */}
          <div style={{ marginTop: 'auto' }}>
            <NavLink to="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: 'var(--clr-text-muted)', textDecoration: 'none',
              }}
            >
              ← Student View
            </NavLink>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--clr-border)' }}>
          <div style={{
            fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.name}
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%', padding: '6px 12px', borderRadius: 8,
              background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
              color: 'var(--clr-text-muted)', fontSize: 12, cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        <div className="mobile-top-bar" style={{ background: '#fffbeb', borderBottomColor: '#fcd34d' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 8,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              flexShrink: 0,
            }}
            aria-label="Open admin menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#92400e" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 16, color: '#92400e',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{
              background: '#f59e0b', color: '#000', borderRadius: 6,
              width: 24, height: 24, display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 900,
            }}>A</span>
            Admin Panel
          </div>
        </div>

        <main className="app-main" style={{ flex: 1, minHeight: 0, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav" style={{ background: '#fffbeb', borderTopColor: '#fcd34d' }}>
        {BOTTOM_ADMIN_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 8px', borderRadius: 8,
              textDecoration: 'none', flex: 1,
              color: isActive ? '#92400e' : '#b45309',
              background: isActive ? 'rgba(245,158,11,0.15)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 9, fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}