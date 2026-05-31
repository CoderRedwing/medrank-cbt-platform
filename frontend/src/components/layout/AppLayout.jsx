import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',   icon: '⬡' },
  { to: '/tests',      label: 'Take a Test',  icon: '✎' },
  { to: '/history',    label: 'My History',   icon: '◷' },
  { to: '/analysis',   label: 'Analysis',     icon: '◈' },
  { to: '/ai-tutor',   label: 'AI Tutor',     icon: '🧠' },
  { to: '/profile',    label: 'Profile',      icon: '◉' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--clr-bg)' }}>

      <aside style={{
        width:220, flexShrink:0,
        background:'var(--clr-surface)',
        borderRight:'1px solid var(--clr-border)',
        display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh',
      }}>
        {/* Logo */}
        <div style={{ padding:'24px 20px 16px', borderBottom:'1px solid var(--clr-border)' }}>
          <div style={{
            fontFamily:'var(--font-display)', fontWeight:800, fontSize:18,
            color:'var(--clr-text)', letterSpacing:'-0.5px',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{
              background:'var(--clr-primary)', color:'#fff', borderRadius:8,
              width:30, height:30, display:'grid', placeItems:'center', fontSize:14, fontWeight:800,
            }}>N</span>
            NEET PG
          </div>
          <div style={{ fontSize:11, color:'var(--clr-text-muted)', marginTop:2 }}>Prep Platform</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:8,
                fontSize:13, fontWeight:500,
                color: isActive ? '#fff' : 'var(--clr-text-muted)',
                background: isActive ? 'var(--clr-primary)' : 'transparent',
                transition:'all 0.15s', textDecoration:'none',
              })}
            >
              <span style={{ fontSize:16 }}>{icon}</span>{label}
            </NavLink>
          ))}

          {/* Admin panel link — only for admins */}
          {user?.role === 'admin' && (
            <NavLink to="/admin"
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10, marginTop:8,
                padding:'9px 12px', borderRadius:8, fontSize:13, fontWeight:600,
                color: isActive ? '#000' : '#f59e0b',
                background: isActive ? '#f59e0b' : 'rgba(245,158,11,.1)',
                border:'1px solid rgba(245,158,11,.3)',
                transition:'all 0.15s', textDecoration:'none',
              })}
            >
              <span style={{ fontSize:15 }}>⚙</span> Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--clr-border)' }}>
          <div style={{ fontSize:12, color:'var(--clr-text-muted)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name}
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width:'100%', padding:'7px 12px', borderRadius:8,
            background:'var(--clr-surface2)', border:'1px solid var(--clr-border)',
            color:'var(--clr-text-muted)', fontSize:12, cursor:'pointer', transition:'all 0.15s',
          }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex:1, minHeight:'100vh', overflowX:'hidden' }}>
        {children}
      </main>
    </div>
  );
}
