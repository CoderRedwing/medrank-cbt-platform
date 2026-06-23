import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/layout/AuthLayout';
import { authAPI } from '../services/api'; // adjust path as needed

const styles = {
  label: {
    display: 'block',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--clr-text-muted)',
    marginBottom: 6,
  },
  fieldWrap: {
    position: 'relative',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 42px 11px 14px',
    borderRadius: 8,
    border: '1px solid var(--clr-border)',
    background: 'var(--clr-bg)',
    fontSize: 14,
    color: 'var(--clr-text)',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--clr-text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  strengthTrack: {
    height: 4,
    background: 'var(--clr-border)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  button: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: 8,
    background: '#6366f1',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.01em',
    marginTop: 22,
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#166534',
    marginBottom: 16,
  },
  alertError: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#991b1b',
    marginBottom: 16,
  },
  linkRow: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
    color: 'var(--clr-text-muted)',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 600,
  },
};

const STRENGTH_LEVELS = [
  { label: '',       color: 'var(--clr-border)', width: '0%'   },
  { label: 'Weak',   color: '#ef4444',            width: '33%'  },
  { label: 'Fair',   color: '#f59e0b',            width: '55%'  },
  { label: 'Good',   color: '#3b82f6',            width: '78%'  },
  { label: 'Strong', color: '#22c55e',            width: '100%' },
];

function getStrengthScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const EyeIcon = ({ visible }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const strength = STRENGTH_LEVELS[getStrengthScore(password)];

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword(token, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a strong password with at least 8 characters, a number, and an uppercase letter."
    >
      {error && (
        <div style={styles.alertError}>
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.alertSuccess}>
          <CheckIcon />
          <span>Password updated! Redirecting you to login…</span>
        </div>
      )}

      <form
        onSubmit={submit}
        style={{ opacity: success ? 0.45 : 1, pointerEvents: success ? 'none' : 'auto' }}
      >
        {/* New Password */}
        <label style={styles.label} htmlFor="rp-pw">New Password</label>
        <div style={styles.fieldWrap}>
          <input
            id="rp-pw"
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={styles.eyeBtn}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            <EyeIcon visible={showPw} />
          </button>
        </div>

        {/* Strength bar */}
        <div style={styles.strengthTrack}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            width: strength.width,
            background: strength.color,
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
        {password && (
          <p style={{ fontSize: 11, color: strength.color, margin: '4px 0 0', fontWeight: 600 }}>
            {strength.label}
          </p>
        )}

        {/* Confirm Password */}
        <div style={{ marginTop: 18 }}>
          <label style={styles.label} htmlFor="rp-confirm">Confirm Password</label>
          <div style={styles.fieldWrap}>
            <input
              id="rp-confirm"
              type={showCf ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowCf((v) => !v)}
              style={styles.eyeBtn}
              aria-label={showCf ? 'Hide confirm password' : 'Show confirm password'}
            >
              <EyeIcon visible={showCf} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <div style={styles.linkRow}>
        <Link to="/login" style={styles.link}>← Back to login</Link>
      </div>
    </AuthLayout>
  );
}