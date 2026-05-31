import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ADMIN_NAV = [
  { to: '/admin',           label: 'Dashboard',    icon: '⬡', end: true },
  { to: '/admin/students',  label: 'Students',     icon: '◉' },
  { to: '/admin/tests',     label: 'All Tests',    icon: '✎' },
  { to: '/admin/papers',    label: 'Manage Papers',icon: '◈' },
  { to: '/admin/settings',  label: 'Settings',     icon: '⚙' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--clr-bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--clr-surface)',
        borderRight: '1px solid var(--clr-border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--clr-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#f59e0b', color: '#000', borderRadius: 7, width: 28, height: 28, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900 }}>A</span>
            Admin Panel
          </div>
          <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>NEET PG Platform</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ADMIN_NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
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
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', textDecoration: 'none' }}
            >
              ← Student View
            </NavLink>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--clr-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ width: '100%', padding: '6px 12px', borderRadius: 8, background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)', fontSize: 12, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minHeight: '100vh', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
