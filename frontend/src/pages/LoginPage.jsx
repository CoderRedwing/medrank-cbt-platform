import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Alert } from '../components/ui/index.jsx';

/* ── Eye icon ───────────────────────────────────────────────────── */
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────── */
function BtnSpinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

export default function LoginPage() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  /* ── Inline validation ──────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!email)                          errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email  = 'Enter a valid email';
    if (!password)                       errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    const res = await login(email, password);
    if (res.success) navigate('/dashboard');
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-card { animation: fadeSlideIn 0.35s ease; }
        .auth-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .auth-btn-primary { transition: all 0.15s; }
        .auth-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--clr-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'grid', placeItems: 'center',
                fontSize: 18,
              }}>🩺</div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 22, color: 'var(--clr-text)',
              }}>
                MedRank <span style={{ color: '#6366f1' }}>CBT</span>
              </span>
            </div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>
              Sign in to continue your preparation
            </p>
          </div>

          {/* Card */}
          <div className="auth-card" style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 16,
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <h1 style={{
              fontSize: 18, fontWeight: 700,
              color: 'var(--clr-text)', marginBottom: 24,
            }}>
              Welcome back
            </h1>

            {error && <Alert type="error" message={error} onClose={clearError} style={{ marginBottom: 16 }} />}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Email */}
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                error={fieldErrors.email}
                disabled={loading}
              />

              {/* Password */}
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                show={showPwd}
                onToggle={() => setShowPwd((v) => !v)}
                error={fieldErrors.password}
                disabled={loading}
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
                style={{
                  width: '100%',
                  padding: '11px 0',
                  marginTop: 4,
                  borderRadius: 8,
                  background: loading ? '#818cf8' : '#6366f1',
                  border: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <><BtnSpinner /> Signing in…</> : 'Sign in'}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--clr-text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared field components ────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, placeholder, error, disabled }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--clr-text-muted)', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required
        className="auth-input"
        style={{
          width: '100%', padding: '10px 14px',
          background: error ? 'rgba(239,68,68,0.04)' : 'var(--clr-surface2)',
          border: `1px solid ${error ? '#fca5a5' : 'var(--clr-border)'}`,
          borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
          outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
        }}
      />
      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, error, disabled }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--clr-text-muted)', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          disabled={disabled}
          required
          className="auth-input"
          style={{
            width: '100%', padding: '10px 40px 10px 14px',
            background: error ? 'rgba(239,68,68,0.04)' : 'var(--clr-surface2)',
            border: `1px solid ${error ? '#fca5a5' : 'var(--clr-border)'}`,
            borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
            outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--clr-text-muted)', padding: 0, display: 'grid', placeItems: 'center',
          }}
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}