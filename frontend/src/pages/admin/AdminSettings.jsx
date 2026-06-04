import { useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Btn, Alert } from '../../components/ui/index.jsx';

export default function AdminSettings() {
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [saving, setSave] = useState(false);
  const [msg, setMsg]     = useState(null);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const createAdmin = async (e) => {
    e.preventDefault();
    setSave(true); setMsg(null);
    try {
      await adminAPI.createAdmin(form);
      setMsg({ type: 'success', text: `Admin account created for ${form.email}` });
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create admin' });
    } finally { setSave(false); }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Settings</h1>
        <p style={styles.pageSub}>Admin account management and platform configuration</p>
      </div>

      {/* Create Admin Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Create admin account</h2>
        <p style={styles.cardDesc}>
          Admin accounts have full access to all platform management features.
        </p>

        {msg && (
          <div style={{ marginBottom: 14 }}>
            <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />
          </div>
        )}

        <form onSubmit={createAdmin} style={styles.form}>
          <Field label="Full name">
            <input
              value={form.name}
              onChange={set('name')}
              required
              style={styles.input}
              placeholder="Admin name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              style={styles.input}
              placeholder="admin@example.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              style={styles.input}
              placeholder="Minimum 6 characters"
            />
          </Field>
          <Btn type="submit" loading={saving} style={styles.submitBtn}>
            Create admin
          </Btn>
        </form>
      </div>

      {/* First-time Setup Card */}
      <div style={{ ...styles.card, ...styles.cardWarn }}>
        <h3 style={styles.warnTitle}>
          <span style={styles.warnIcon}>⚙</span> First-time setup
        </h3>
        <p style={styles.cardDesc}>
          To create the very first admin account before any admin exists, run the seed script from
          the backend directory:
        </p>
        <pre style={styles.codeBlock}>
{`npm run seed:admin
# Default credentials:
# Email:    admin@neetpg.local
# Password: Admin@1234`}
        </pre>
        <p style={styles.dangerNote}>
          ⚠ Change the default password immediately after first login.
        </p>
      </div>

      {/* Admin Capabilities Card */}
      <div style={{ ...styles.card, ...styles.cardInfo }}>
        <h3 style={styles.infoTitle}>Admin capabilities</h3>
        <ul style={styles.capsList}>
          {CAPABILITIES.map(({ icon, text }) => (
            <li key={text} style={styles.capsItem}>
              <span style={styles.capsIcon}>{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const CAPABILITIES = [
  { icon: '👥', text: 'View all registered students and their performance' },
  { icon: '✏️', text: 'Edit student profiles and assign roles' },
  { icon: '🗑️', text: 'Delete student accounts and test data' },
  { icon: '📋', text: 'Browse all test sessions platform-wide' },
  { icon: '📝', text: 'Add, edit, and delete questions in any paper' },
  { icon: '📊', text: 'View platform-wide analytics and trends' },
  { icon: '👤', text: 'Create additional admin accounts' },
];

const styles = {
  page: {
    padding: '28px 24px',
    maxWidth: 680,
    margin: '0 auto',
  },
  header: {
    marginBottom: 28,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--clr-text)',
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 14,
    color: 'var(--clr-text-muted)',
  },
  card: {
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 12,
    padding: '20px 22px',
    marginBottom: 12,
  },
  cardWarn: {
    borderColor: 'rgba(245,158,11,0.35)',
  },
  cardInfo: {
    borderColor: 'rgba(99,102,241,0.3)',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--clr-text)',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: 'var(--clr-text-muted)',
    lineHeight: 1.6,
    marginBottom: 18,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--clr-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    background: 'var(--clr-surface2)',
    border: '1px solid var(--clr-border)',
    borderRadius: 8,
    color: 'var(--clr-text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    width: 'fit-content',
    marginTop: 4,
  },
  warnTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    fontWeight: 700,
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  warnIcon: {
    fontSize: 15,
  },
  codeBlock: {
    background: 'var(--clr-surface2)',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#10b981',
    marginTop: 8,
    overflowX: 'auto',
    lineHeight: 1.7,
  },
  dangerNote: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  infoTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--clr-primary)',
    marginBottom: 14,
  },
  capsList: {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  capsItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: 'var(--clr-text-muted)',
    lineHeight: 1.5,
  },
  capsIcon: {
    fontSize: 14,
    flexShrink: 0,
    marginTop: 1,
  },
};