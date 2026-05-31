import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Btn, Alert } from '../components/ui/index.jsx';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--clr-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 28, color: 'var(--clr-text)',
          }}>
            NEET PG <span style={{ color: 'var(--clr-primary)' }}>Prep</span>
          </div>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginTop: 6 }}>
            Sign in to continue your preparation
          </p>
        </div>

        <div style={{
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          borderRadius: 16, padding: 32,
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            Welcome back
          </h1>

          {error && <Alert type="error" message={error} onClose={clearError} />}

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            <Btn type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
              Sign in
            </Btn>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--clr-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--clr-surface2)',
          border: '1px solid var(--clr-border)',
          borderRadius: 8, color: 'var(--clr-text)',
          fontSize: 14, outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--clr-primary)'}
        onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
      />
    </div>
  );
}
