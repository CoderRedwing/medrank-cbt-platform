import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Spinner } from '../../components/ui/index.jsx';
import { accuracyColor } from '../../utils/helpers';

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  padding: '8px 11px',
  background: 'var(--clr-surface2)',
  border: '1px solid var(--clr-border)',
  borderRadius: 8,
  color: 'var(--clr-text)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

function FormField({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--clr-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionBtn({ color, children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${hov ? color : color + '40'}`,
        background: hov ? color + '22' : color + '12',
        color,
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose, width = 500 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20,
    }}>
      <div style={{
        background: 'var(--clr-surface)',
        border: '1px solid var(--clr-border)',
        borderRadius: 12,
        width, maxWidth: '95vw',
        maxHeight: '88vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          borderBottom: '1px solid var(--clr-border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--clr-text)' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--clr-text-muted)', fontSize: 20,
              cursor: 'pointer', lineHeight: 1, padding: '0 2px',
              borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '18px 18px 20px', flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function InlineBtn({ children, onClick, variant = 'primary', disabled, loading }) {
  const styles = {
    primary:   { bg: '#6366f1', color: '#fff', border: 'none' },
    danger:    { bg: '#dc2626', color: '#fff', border: 'none' },
    secondary: { bg: 'var(--clr-surface2)', color: 'var(--clr-text)', border: '1px solid var(--clr-border)' },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        background: (disabled || loading) ? '#94a3b8' : s.bg,
        border: s.border,
        color: s.color,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || loading) ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {loading ? 'Saving…' : children}
    </button>
  );
}

// ── Detail stat cell ──────────────────────────────────────────────────────────
function StatCell({ label, value }) {
  return (
    <div style={{
      background: 'var(--clr-surface2)',
      border: '1px solid var(--clr-border)',
      padding: '10px 12px',
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--clr-text)' }}>{value}</div>
    </div>
  );
}

// ── Target exam pill ──────────────────────────────────────────────────────────
function ExamPill({ value }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 99,
      background: 'rgba(99,102,241,0.1)',
      border: '1px solid rgba(99,102,241,0.25)',
      color: '#6366f1',
      whiteSpace: 'nowrap',
    }}>
      {value?.replace('_', ' ') || '—'}
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminStudents() {
  const [data, setData]         = useState(null);
  const [loading, setLoad]      = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [searchInput, setSI]    = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [editForm, setEF]       = useState({});

  const load = () => {
    setLoad(true);
    adminAPI.getStudents(page, 30, search)
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  };

  useEffect(() => { load(); }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openEdit = (s) => {
    setEditing(s);
    setEF({ name: s.name, email: s.email, targetExam: s.targetExam, role: s.role });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminAPI.updateStudent(editing._id, editForm);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteStudent(deleting);
      setDeleting(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openDetail = async (id) => {
    try {
      const { data } = await adminAPI.getStudentDetail(id);
      setSelected(data.data);
    } catch {
      alert('Failed to load student detail');
    }
  };

  const TH = ['Name', 'Email', 'Target', 'Tests', 'Accuracy', 'Joined', 'Actions'];

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--clr-text)', letterSpacing: '-0.02em' }}>
            Students
          </h1>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, marginTop: 4 }}>
            {data?.total || 0} registered students
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13, color: 'var(--clr-text-muted)',
              pointerEvents: 'none',
            }}>
              🔍
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSI(e.target.value)}
              placeholder="Search name or email…"
              style={{
                padding: '8px 12px 8px 30px',
                background: 'var(--clr-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 8,
                color: 'var(--clr-text)',
                fontSize: 13,
                width: 220,
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'var(--clr-border)'}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: '#6366f1',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSI(''); setPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                background: 'var(--clr-surface2)',
                border: '1px solid var(--clr-border)',
                color: 'var(--clr-text-muted)',
                cursor: 'pointer',
              }}
            >
              ✕ Clear
            </button>
          )}
        </form>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Spinner size={32} />
        </div>
      ) : (
        <>
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--clr-border)', background: 'var(--clr-surface2)' }}>
                  {TH.map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--clr-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.students?.length ? data.students.map((s) => (
                  <tr
                    key={s._id}
                    style={{ borderBottom: '1px solid var(--clr-border)', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--clr-surface2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Name */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          display: 'grid', placeItems: 'center',
                          fontSize: 11, fontWeight: 600, color: '#6366f1',
                          flexShrink: 0,
                        }}>
                          {s.name?.charAt(0).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text)' }}>
                          {s.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--clr-text-muted)' }}>
                      {s.email}
                    </td>

                    {/* Target */}
                    <td style={{ padding: '10px 14px' }}>
                      <ExamPill value={s.targetExam} />
                    </td>

                    {/* Tests */}
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--clr-text)' }}>
                      {s.stats?.totalTestsTaken || 0}
                    </td>

                    {/* Accuracy */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 44, height: 4,
                          background: 'var(--clr-border)',
                          borderRadius: 99, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${s.stats?.averageAccuracy || 0}%`,
                            background: accuracyColor(s.stats?.averageAccuracy || 0),
                            borderRadius: 99,
                          }} />
                        </div>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: accuracyColor(s.stats?.averageAccuracy || 0),
                        }}>
                          {s.stats?.averageAccuracy || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--clr-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <ActionBtn color="#6366f1" onClick={() => openDetail(s._id)}>View</ActionBtn>
                        <ActionBtn color="#d97706" onClick={() => openEdit(s)}>Edit</ActionBtn>
                        <ActionBtn color="#dc2626" onClick={() => setDeleting(s._id)}>Delete</ActionBtn>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: 13 }}>
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {data?.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12,
                  background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                  color: page === 1 ? 'var(--clr-text-muted)' : 'var(--clr-text)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.45 : 1,
                }}
              >
                ← Prev
              </button>

              {Array.from({ length: data.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} style={{ fontSize: 12, color: 'var(--clr-text-muted)', padding: '0 4px' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 32, height: 32, borderRadius: 7,
                        fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        background: page === p ? '#6366f1' : 'var(--clr-surface)',
                        border: `1px solid ${page === p ? '#6366f1' : 'var(--clr-border)'}`,
                        color: page === p ? '#fff' : 'var(--clr-text-muted)',
                        transition: 'all 0.12s',
                      }}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12,
                  background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                  color: page === data.pages ? 'var(--clr-text-muted)' : 'var(--clr-text)',
                  cursor: page === data.pages ? 'not-allowed' : 'pointer',
                  opacity: page === data.pages ? 0.45 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Detail modal ── */}
      {selected && (
        <Modal title={`${selected.student.name}`} onClose={() => setSelected(null)} width={540}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
            {[
              ['Email',        selected.student.email],
              ['Target exam',  selected.student.targetExam?.replace('_', ' ')],
              ['Tests taken',  selected.student.stats?.totalTestsTaken || 0],
              ['Avg accuracy', `${selected.student.stats?.averageAccuracy || 0}%`],
              ['Total correct',selected.student.stats?.totalCorrect || 0],
              ['Member since', new Date(selected.student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
            ].map(([k, v]) => (
              <StatCell key={k} label={k} value={v} />
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Recent tests
          </div>

          {selected.recentTests?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selected.recentTests.slice(0, 5).map((t) => (
                <div key={t._id} style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  padding: '8px 10px', borderRadius: 7, fontSize: 13,
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--clr-surface2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--clr-text)' }}>
                    {t.paper_title}
                  </span>
                  <span style={{ fontWeight: 500, color: accuracyColor(t.accuracy), flexShrink: 0 }}>
                    {t.accuracy}%
                  </span>
                  <span style={{ color: 'var(--clr-text-muted)', fontSize: 11, flexShrink: 0 }}>
                    {t.correct_count}/{t.total_questions}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No tests taken yet.</p>
          )}
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <Modal title="Edit student" onClose={() => setEditing(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[
              { k: 'name',  label: 'Full name', type: 'text'  },
              { k: 'email', label: 'Email',     type: 'email' },
            ].map(({ k, label, type }) => (
              <FormField key={k} label={label}>
                <input
                  type={type}
                  value={editForm[k] || ''}
                  onChange={(e) => setEF((p) => ({ ...p, [k]: e.target.value }))}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
                />
              </FormField>
            ))}
            <FormField label="Target exam">
              <select
                value={editForm.targetExam || ''}
                onChange={(e) => setEF((p) => ({ ...p, targetExam: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['NEET_PG', 'INI_CET', 'FMGE', 'OTHER'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Role">
              <select
                value={editForm.role || 'student'}
                onChange={(e) => setEF((p) => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </FormField>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <InlineBtn loading={saving} onClick={saveEdit}>Save changes</InlineBtn>
              <InlineBtn variant="secondary" onClick={() => setEditing(null)}>Cancel</InlineBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleting && (
        <Modal title="Delete student?" onClose={() => setDeleting(null)} width={400}>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.65, marginBottom: 6 }}>
            This will permanently delete the student and all their test data.
          </p>
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 12,
            color: '#991b1b',
            marginBottom: 20,
            lineHeight: 1.5,
          }}>
            ⚠ This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <InlineBtn variant="danger" onClick={confirmDelete}>Delete student</InlineBtn>
            <InlineBtn variant="secondary" onClick={() => setDeleting(null)}>Cancel</InlineBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}