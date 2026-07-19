import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Spinner, Btn, Alert } from '../../components/ui/index.jsx';

const STATUS_STYLE = {
  upcoming: { color: '#f59e0b', label: 'Upcoming' },
  live:     { color: '#16a34a', label: 'Live' },
  ended:    { color: '#9ca3af', label: 'Ended' },
};

export default function AdminLiveTests() {
  const [tests, setTests]       = useState(null);
  const [papers, setPapers]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ paper_ref: '', starts_at: '', ends_at: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [testsRes, papersRes] = await Promise.all([
        adminAPI.getLiveTests(),
        adminAPI.listLiveTestPapers(),
      ]);
      setTests(testsRes.data.data);
      setPapers(papersRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const scheduledRefs = new Set((tests || []).map((t) => t.paper_ref));
  const availablePapers = papers.filter((p) => !scheduledRefs.has(p.paper_id));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.paper_ref || !form.starts_at || !form.ends_at) return;
    setSaving(true);
    setError('');
    try {
      await adminAPI.createLiveTest({
        paper_ref: form.paper_ref,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at:   new Date(form.ends_at).toISOString(),
      });
      setForm({ paper_ref: '', starts_at: '', ends_at: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule live test');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this scheduled live test? Students will no longer be able to attempt it.')) return;
    try {
      await adminAPI.deleteLiveTest(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateLiveTest(id, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-text)' }}>Live Quiz Scheduling</h1>
          <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', marginTop: 4 }}>
            Schedule a dataset paper as a timed live test. Students see a countdown and can only attempt during the window.
          </p>
        </div>
        <Btn onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Schedule live test'}</Btn>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {showForm && (
        <Card style={{ padding: 18, marginBottom: 20 }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 4 }}>Paper</label>
              <select
                required
                value={form.paper_ref}
                onChange={(e) => setForm({ ...form, paper_ref: e.target.value })}
                style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface2)', color: 'var(--clr-text)', fontSize: 13 }}
              >
                <option value="">Select a paper from dataset…</option>
                {availablePapers.map((p) => (
                  <option key={p.paper_id} value={p.paper_id}>
                    {p.paper_title} ({p.total_questions} Qs, {p.duration_minutes} min)
                  </option>
                ))}
              </select>
              {availablePapers.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 4 }}>
                  Every live_tests dataset paper is already scheduled. Add more papers to backend/data/neet_pg_dataset/live_tests/ to schedule more.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 4 }}>Starts at</label>
                <input
                  type="datetime-local"
                  required
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface2)', color: 'var(--clr-text)', fontSize: 13 }}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 4 }}>Ends at</label>
                <input
                  type="datetime-local"
                  required
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface2)', color: 'var(--clr-text)', fontSize: 13 }}
                />
              </div>
            </div>
            <Btn type="submit" loading={saving} style={{ alignSelf: 'flex-start' }}>Schedule</Btn>
          </form>
        </Card>
      )}

      {(!tests || tests.length === 0) ? (
        <Card style={{ padding: 30, textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: 13 }}>
          No live tests scheduled yet.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tests.map((t) => {
            const meta = STATUS_STYLE[t.status] || STATUS_STYLE.upcoming;
            return (
              <Card key={t._id} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--clr-text)' }}>{t.paper_title}</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>{t.paper_ref}</div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 6 }}>
                    {new Date(t.starts_at).toLocaleString()} → {new Date(t.ends_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, color: meta.color, background: `${meta.color}1a` }}>
                    ● {meta.label}
                  </span>
                  {t.status !== 'ended' && (
                    <Btn size="sm" variant="ghost" onClick={() => updateStatus(t._id, 'ended')}>End now</Btn>
                  )}
                  <Btn size="sm" variant="danger" onClick={() => remove(t._id)}>Delete</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
