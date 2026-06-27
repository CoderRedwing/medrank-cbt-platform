import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import { Spinner } from '../components/ui/index.jsx';

// ── Inline field component ───────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--clr-text-muted)',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 4, opacity: 0.7 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--clr-surface2)',
  border: '1px solid var(--clr-border)',
  borderRadius: 8,
  color: 'var(--clr-text)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

// ── Stat card ────────────────────────────────────────────────────────────────
function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--clr-surface2)',
      border: '1px solid var(--clr-border)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        fontSize: 22,
        fontWeight: 600,
        color: color || '#6366f1',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ children }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      padding: '13px 18px',
      borderBottom: '1px solid var(--clr-border)',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--clr-text)',
    }}>
      {children}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '9px 14px',
      borderRadius: 8,
      fontSize: 13,
      background: isSuccess ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`,
      color: isSuccess ? '#166534' : '#991b1b',
      marginBottom: 16,
    }}>
      <span>{isSuccess ? '✓' : '!'}</span>
      {msg.text}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, init }    = useAuthStore();
  const [name, setName]   = useState(user?.name || '');
  const [target, setT]    = useState(user?.targetExam || 'NEET_PG');
  const [saving, setSave] = useState(false);
  const [msg, setMsg]     = useState(null);

  const save = async () => {
    setSave(true);
    setMsg(null);
    try {
      await authAPI.updateMe({ name, targetExam: target });
      await init();
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMsg({ type: 'error', text: 'Update failed. Please try again.' });
    } finally {
      setSave(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const s = user?.stats || {};

  // Initials avatar
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 28px) 48px', maxWidth: 620, margin: '0 auto' }}>

      {/* ── Profile header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Avatar */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.12)',
          border: '2px solid rgba(99,102,241,0.25)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 16,
          fontWeight: 600,
          color: '#6366f1',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--clr-text)', letterSpacing: '-0.01em' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>
            {user?.email} · {user?.targetExam?.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
        marginBottom: 20,
      }}>
        <MiniStat
          label="Tests taken"
          value={s.totalTestsTaken || 0}
          color="#6366f1"
        />
        <MiniStat
          label="Avg accuracy"
          value={`${s.averageAccuracy || 0}%`}
          color={s.averageAccuracy >= 70 ? '#16a34a' : s.averageAccuracy >= 50 ? '#d97706' : '#dc2626'}
        />
        <MiniStat
          label="Qs attempted"
          value={(s.totalQuestionsAttempted || 0).toLocaleString()}
          color="#d97706"
        />
      </div>

      {/* ── Account settings ── */}
      <Section>
        <SectionHeader>Account settings</SectionHeader>
        <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Toast msg={msg} />

          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
            />
          </Field>

          <Field label="Email" hint="Email cannot be changed.">
            <input
              value={user?.email}
              disabled
              style={{
                ...inputStyle,
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
            />
          </Field>

          <Field label="Target exam">
            <select
              value={target}
              onChange={(e) => setT(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
            >
              <option value="NEET_PG">NEET PG</option>
              <option value="INI_CET">INI-CET</option>
              <option value="FMGE">FMGE</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>

          {/* Save button */}
          <div style={{ paddingTop: 2 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: saving ? '#4f46e5' : '#6366f1',
                border: 'none',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.75 : 1, minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.opacity = '1'; }}
            >
              {saving && <Spinner size={13} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </Section>

      {/* ── Account info ── */}
      <Section style={{ marginTop: 12 }}>
        <SectionHeader>Account info</SectionHeader>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Member since', value: memberSince },
            { label: 'Role',         value: user?.role   },
            { label: 'Target exam',  value: user?.targetExam?.replace('_', ' ') },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
              <span style={{
                fontWeight: 500,
                color: 'var(--clr-text)',
                background: 'var(--clr-surface2)',
                border: '1px solid var(--clr-border)',
                padding: '2px 9px',
                borderRadius: 6,
                fontSize: 12,
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}