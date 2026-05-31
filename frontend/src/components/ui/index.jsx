import { cx } from '../../utils/helpers';

/* ── Button ────────────────────────────────────────────────────────── */
export function Btn({ children, variant = 'primary', size = 'md', loading, disabled, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary:  'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/30',
    secondary:'bg-[#171d2e] hover:bg-[#1e2638] text-[#e8eaf0] border border-[#1e2638] hover:border-[#2a3450]',
    danger:   'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
    success:  'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30',
    ghost:    'hover:bg-white/5 text-[#7c8499] hover:text-[#e8eaf0]',
    outline:  'border border-[#2a3450] hover:border-indigo-500/50 text-[#e8eaf0] hover:bg-indigo-600/10',
  };
  const sizes = {
    sm:  'px-3 py-1.5 text-xs',
    md:  'px-4 py-2 text-sm',
    lg:  'px-6 py-3 text-base',
    xl:  'px-8 py-4 text-lg',
    icon:'p-2',
  };
  return (
    <button className={cx(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

/* ── Card ──────────────────────────────────────────────────────────── */
export function Card({ children, className, ...props }) {
  return (
    <div
      className={cx('rounded-xl border border-[#1e2638] bg-[#111520] p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Badge ─────────────────────────────────────────────────────────── */
export function Badge({ children, color = 'indigo', className }) {
  const colors = {
    indigo:  'bg-indigo-500/15 text-indigo-400',
    green:   'bg-emerald-500/15 text-emerald-400',
    amber:   'bg-amber-500/15 text-amber-400',
    red:     'bg-red-500/15 text-red-400',
    blue:    'bg-blue-500/15 text-blue-400',
    gray:    'bg-white/5 text-gray-400',
  };
  return (
    <span className={cx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[color] || colors.gray, className)}>
      {children}
    </span>
  );
}

/* ── Spinner ───────────────────────────────────────────────────────── */
export function Spinner({ size = 24, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity=".2" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ── Progress Bar ──────────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, color = '#6366f1', height = 6, showLabel = false, className }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[#7c8499] mb-1">
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height, borderRadius: 99, background: '#1e2638', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Divider ───────────────────────────────────────────────────────── */
export function Divider({ className }) {
  return <hr className={cx('border-[#1e2638]', className)} />;
}

/* ── Empty State ───────────────────────────────────────────────────── */
export function Empty({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-4xl opacity-40">{icon}</div>}
      <p className="text-[#e8eaf0] font-semibold text-lg">{title}</p>
      {subtitle && <p className="text-[#7c8499] text-sm max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

/* ── Stat tile ─────────────────────────────────────────────────────── */
export function StatTile({ label, value, sub, color = '#6366f1', icon }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7c8499] font-medium uppercase tracking-wider">{label}</span>
        {icon && <span style={{ color }} className="text-lg">{icon}</span>}
      </div>
      <div
  className="text-3xl font-bold"
  style={{
    fontFamily: 'Syne,sans-serif',
    color
  }}
>
        {value}
      </div>
      {sub && <div className="text-xs text-[#7c8499]">{sub}</div>}
    </Card>
  );
}

/* ── Loading Screen ────────────────────────────────────────────────── */
export function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="fixed inset-0 bg-[#0a0d14] flex flex-col items-center justify-center gap-4 z-50">
      <Spinner size={40} />
      <p className="text-[#7c8499] text-sm">{message}</p>
    </div>
  );
}

/* ── Alert ─────────────────────────────────────────────────────────── */
export function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;
  const styles = {
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info:    'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  };
  return (
    <div className={cx('flex items-center gap-3 px-4 py-3 rounded-lg border text-sm', styles[type])}>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
      )}
    </div>
  );
}
