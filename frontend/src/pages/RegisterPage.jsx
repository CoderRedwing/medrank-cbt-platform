import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Btn, Alert } from '../components/ui/index.jsx';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', targetExam: 'NEET_PG' });
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form);
    if (res.success) navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--clr-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--clr-text)' }}>
            NEET PG <span style={{ color: 'var(--clr-primary)' }}>Prep</span>
          </div>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginTop: 6 }}>
            Create your account and start preparing
          </p>
        </div>

        <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Create account</h1>

          {error && <Alert type="error" message={error} onClose={clearError} />}

          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Full Name" value={form.name} onChange={set('name')} placeholder="Dr. Priya Sharma" />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            <Field label="Password" type="password" value={form.password} 
              onChange={set('password')} placeholder="Min 8 chars, 1 uppercase, 1 number" />

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 6 }}>
                Target Exam
              </label>
              <select
                value={form.targetExam} onChange={set('targetExam')}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
                  borderRadius: 8, color: 'var(--clr-text)', fontSize: 14,
                }}
              >
                <option value="NEET_PG">NEET PG</option>
                <option value="INI_CET">INI-CET</option>
                <option value="FMGE">FMGE</option>
              </select>
            </div>

            <Btn type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
              Create account
            </Btn>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--clr-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
          borderRadius: 8, color: 'var(--clr-text)', fontSize: 14, outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--clr-primary)'}
        onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
      />
    </div>
  );
}
