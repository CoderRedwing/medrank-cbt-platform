import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/layout/AuthLayout';
import { authAPI } from '../services/api';

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
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid var(--clr-border)',
    background: 'var(--clr-bg)',
    fontSize: 14,
    color: 'var(--clr-text)',
    outline: 'none',
    marginBottom: 18,
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await authAPI.forgotPassword({
  email,
});
      setSuccess(data.message || 'Reset link sent! Check your inbox and spam folder.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="No worries — enter your email and we'll send you a reset link within a minute."
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
          <span>{success}</span>
        </div>
      )}

      <form
        onSubmit={submit}
        style={{ opacity: success ? 0.45 : 1, pointerEvents: success ? 'none' : 'auto' }}
      >
        <label style={styles.label} htmlFor="fp-email">Email</label>
        <input
          id="fp-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={styles.input}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div style={styles.linkRow}>
        <Link to="/login" style={styles.link}>← Back to login</Link>
      </div>
    </AuthLayout>
  );
}