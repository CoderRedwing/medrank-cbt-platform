import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import { Card, Btn, Alert } from '../components/ui/index.jsx';

export default function ProfilePage() {
  const { user, init }  = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [target, setT]  = useState(user?.targetExam || 'NEET_PG');
  const [saving, setSave] = useState(false);
  const [msg, setMsg]   = useState(null);

  const save = async () => {
    setSave(true);
    try {
      await authAPI.updateMe({ name, targetExam: target });
      await init();
      setMsg({ type: 'success', text: 'Profile updated!' });
    } catch {
      setMsg({ type: 'error', text: 'Update failed.' });
    } finally {
      setSave(false);
    }
  };

  const s = user?.stats || {};

  return (
    <div style={{ padding: '32px 28px', maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Profile</h1>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Tests Taken',   value: s.totalTestsTaken || 0 },
          { label: 'Avg Accuracy',  value: `${s.averageAccuracy || 0}%` },
          { label: 'Qs Attempted',  value: s.totalQuestionsAttempted || 0 },
        ].map((item) => (
          <Card key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--clr-primary)' }}>{item.value}</div>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 4 }}>{item.label}</div>
          </Card>
        ))}
      </div>

      {/* Edit form */}
      <Card>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Account Settings</h2>

        {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 6 }}>Full Name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 6 }}>Email</label>
            <input
              value={user?.email} disabled
              style={{ width: '100%', padding: '10px 14px', background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text-muted)', fontSize: 14, cursor: 'not-allowed' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 6 }}>Target Exam</label>
            <select
              value={target} onChange={(e) => setT(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)', fontSize: 14 }}
            >
              <option value="NEET_PG">NEET PG</option>
              <option value="INI_CET">INI-CET</option>
              <option value="FMGE">FMGE</option>
            </select>
          </div>
          <Btn loading={saving} onClick={save} style={{ width: 'fit-content' }}>Save Changes</Btn>
        </div>
      </Card>

      {/* Account info */}
      <Card style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Account Info</h2>
        <div style={{ fontSize: 13, color: 'var(--clr-text-muted)', lineHeight: 2 }}>
          <div>Member since: <strong style={{ color: 'var(--clr-text)' }}>{new Date(user?.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></div>
          <div>Role: <strong style={{ color: 'var(--clr-text)' }}>{user?.role}</strong></div>
        </div>
      </Card>
    </div>
  );
}
