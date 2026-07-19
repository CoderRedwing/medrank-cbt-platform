import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../NotificationBell';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',   icon: '⬡' },
  { to: '/tests',      label: 'Take a Test',  icon: '✎' },
  { to: '/live-test',  label: 'Live Quiz',    icon: '🔴' },
  { to: '/history',    label: 'My History',   icon: '◷' },
  { to: '/analysis',   label: 'Analysis',     icon: '◈' },
  { to: '/ai-tutor',   label: 'AI Tutor',     icon: '🧠' },
  { to: '/profile',    label: 'Profile',      icon: '◉' },
];

// Only the 5 most important items appear in bottom nav
const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',    icon: '⬡' },
  { to: '/tests',     label: 'Test',    icon: '✎' },
  { to: '/history',   label: 'History', icon: '◷' },
  { to: '/analysis',  label: 'Analysis',icon: '◈' },
  { to: '/profile',   label: 'Profile', icon: '◉' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--clr-bg)' }}>

      {/* ── Sidebar overlay (mobile only) ────────────────────────── */}
      {drawerOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`app-sidebar${drawerOpen ? ' is-open' : ''}`}
        style={{
          width: 'var(--sidebar-w)', flexShrink: 0,
          background: 'var(--clr-surface)',
          borderRight: '1px solid var(--clr-border)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--clr-border)' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
            color: 'var(--clr-text)', letterSpacing: '-0.5px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              background: 'var(--clr-primary)', color: '#fff', borderRadius: 8,
              width: 30, height: 30, display: 'grid', placeItems: 'center',
              fontSize: 14, fontWeight: 800,
            }}>N</span>
            NEET PG
          </div>
          <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>Prep Platform</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              onClick={() => setDrawerOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: isActive ? '#fff' : 'var(--clr-text-muted)',
                background: isActive ? 'var(--clr-primary)' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>{label}
            </NavLink>
          ))}

          {/* Admin panel link — only for admins */}
          {user?.role === 'admin' && (
            <NavLink to="/admin"
              onClick={() => setDrawerOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
                padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: isActive ? '#000' : '#f59e0b',
                background: isActive ? '#f59e0b' : 'rgba(245,158,11,.1)',
                border: '1px solid rgba(245,158,11,.3)',
                transition: 'all 0.15s', textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: 15 }}>⚙</span> Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--clr-border)' }}>
          <div style={{
            fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.name}
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px 12px', borderRadius: 8,
            background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
            color: 'var(--clr-text-muted)', fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Mobile top bar (hidden on desktop via CSS) ─────────── */}
        <div className="mobile-top-bar">
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 8,
              background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
              flexShrink: 0,
            }}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--clr-text)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Brand */}
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{
              background: 'var(--clr-primary)', color: '#fff', borderRadius: 6,
              width: 24, height: 24, display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 800,
            }}>N</span>
            NEET PG
          </div>

          {/* Right: notifications + user avatar */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <div style={{
              width: 32, 
              height: 32, 
              borderRadius: '50%',
              background: 'var(--clr-primary)', 
              color: '#fff',
              display: 'grid', 
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 700,
           }}>
         {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        </div>
        </div>
        {/* ── Desktop top bar (hidden on mobile via CSS) ─────────── */}
        <div className="desktop-top-bar">
          <NotificationBell />
        </div>
        {/* ── Page content ──────────────────────────────────────── */}
        <main className="app-main" style={{ flex: 1, minHeight: 0, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ──────────────────────────────── */}
      <nav className="mobile-bottom-nav">
        {BOTTOM_NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 10px', borderRadius: 8,
              textDecoration: 'none', flex: 1,
              color: isActive ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              background: isActive ? `rgba(45,74,122,0.08)` : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}