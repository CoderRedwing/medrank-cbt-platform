import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Alert } from '../components/ui/index.jsx';

/* ── Icons ───────────────────────────────────────────────────────── */
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

function BtnSpinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

/* ── Password strength ───────────────────────────────────────────── */
function pwdStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a'];

export default function RegisterPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', targetExam: 'NEET_PG' });
  const [showPwd,  setShowPwd]  = useState(false);
  const [fieldErrors, setFE]    = useState({});
  const [success,  setSuccess]  = useState(false);
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  /* ── Validation ─────────────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!form.name.trim())                        errs.name     = 'Full name is required';
    if (!form.email)                              errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))   errs.email    = 'Enter a valid email';
    if (!form.password)                           errs.password = 'Password is required';
    else if (form.password.length < 8)            errs.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password))        errs.password = 'Include at least one uppercase letter';
    else if (!/[0-9]/.test(form.password))        errs.password = 'Include at least one number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const errs = validate();
    if (Object.keys(errs).length) { setFE(errs); return; }
    setFE({});
    const res = await register(form);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    }
  };

  const strength = pwdStrength(form.password);

  /* ── Success screen ─────────────────────────────────────────────── */
  if (success) return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes popIn { 0%{opacity:0;transform:scale(0.8)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }`}</style>
      <div style={{
        minHeight: '100vh', background: 'var(--clr-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', animation: 'popIn 0.4s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8 }}>
            Welcome, {form.name.split(' ')[0]}!
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 14 }}>
            Your account is ready. Taking you to the dashboard…
          </p>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 0.75s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .auth-card { animation: fadeSlideIn 0.35s ease; }
        .auth-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .auth-btn-primary { transition: all 0.15s; }
        .auth-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{
        minHeight: '100vh', background: 'var(--clr-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'grid', placeItems: 'center', fontSize: 18,
              }}>🩺</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--clr-text)' }}>
                MedRank <span style={{ color: '#6366f1' }}>CBT</span>
              </span>
            </div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>
              Create your account and start preparing
            </p>
          </div>

          {/* Card */}
          <div className="auth-card" style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 16, padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 24 }}>
              Create account
            </h1>

            {error && <Alert type="error" message={error} onClose={clearError} style={{ marginBottom: 16 }} />}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <Field label="Full Name" value={form.name}
                onChange={set('name')} placeholder="Dr. Priya Sharma"
                error={fieldErrors.name} disabled={loading} />

              {/* Email */}
              <Field label="Email" type="email" value={form.email}
                onChange={set('email')} placeholder="you@example.com"
                error={fieldErrors.email} disabled={loading} />

              {/* Password + strength */}
              <div>
                <PasswordField
                  label="Password"
                  value={form.password}
                  onChange={set('password')}
                  show={showPwd}
                  onToggle={() => setShowPwd((v) => !v)}
                  error={fieldErrors.password}
                  disabled={loading}
                />
                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 99,
                          background: i <= strength ? STRENGTH_COLOR[strength] : 'var(--clr-border)',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: STRENGTH_COLOR[strength], marginTop: 4 }}>
                      {STRENGTH_LABEL[strength]} password
                    </p>
                  </div>
                )}
              </div>

              {/* Target exam */}
              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'var(--clr-text-muted)', marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Target Exam
                </label>
                <select
                  value={form.targetExam}
                  onChange={(e) => set('targetExam')(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
                    borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
                    outline: 'none', cursor: 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <option value="NEET_PG">NEET PG</option>
                  <option value="INI_CET">INI-CET</option>
                  <option value="FMGE">FMGE</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
                style={{
                  width: '100%', padding: '11px 0', marginTop: 4,
                  borderRadius: 8,
                  background: loading ? '#818cf8' : '#6366f1',
                  border: 'none', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <><BtnSpinner /> Creating account…</> : 'Create account'}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--clr-text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
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
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled} required
        className="auth-input"
        style={{
          width: '100%', padding: '10px 14px',
          background: error ? 'rgba(239,68,68,0.04)' : 'var(--clr-surface2)',
          border: `1px solid ${error ? '#fca5a5' : 'var(--clr-border)'}`,
          borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
          outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box', opacity: disabled ? 0.6 : 1,
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, marginBottom: 0 }}>{error}</p>}
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
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          disabled={disabled} required
          className="auth-input"
          style={{
            width: '100%', padding: '10px 40px 10px 14px',
            background: error ? 'rgba(239,68,68,0.04)' : 'var(--clr-surface2)',
            border: `1px solid ${error ? '#fca5a5' : 'var(--clr-border)'}`,
            borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
            outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box', opacity: disabled ? 0.6 : 1,
          }}
        />
        <button type="button" onClick={onToggle} tabIndex={-1} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--clr-text-muted)', padding: 0, display: 'grid', placeItems: 'center',
        }}>
          <EyeIcon open={show} />
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, marginBottom: 0 }}>{error}</p>}
    </div>
  );
}