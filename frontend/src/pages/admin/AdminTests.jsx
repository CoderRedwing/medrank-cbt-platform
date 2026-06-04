import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Card, Spinner, Badge } from '../../components/ui/index.jsx';
import { accuracyColor, scoreColor, formatTime } from '../../utils/helpers';

const TYPE_LABELS = {
  full_paper: 'Full Paper', subject_paper: 'Subject',
  topic_wise: 'Topic', ai_generated: 'AI Gen',
};

const TYPE_STYLE = {
  full_paper:    { bg: 'rgba(99,102,241,.1)',  color: '#818cf8', border: 'rgba(99,102,241,.25)'  },
  subject_paper: { bg: 'rgba(59,130,246,.1)',  color: '#60a5fa', border: 'rgba(59,130,246,.25)'  },
  topic_wise:    { bg: 'rgba(16,185,129,.1)',  color: '#34d399', border: 'rgba(16,185,129,.25)'  },
  ai_generated:  { bg: 'rgba(245,158,11,.1)',  color: '#fbbf24', border: 'rgba(245,158,11,.25)'  },
};

const FILTER_OPTIONS = [
  { value: '',               label: 'All types' },
  { value: 'full_paper',    label: 'Full Paper' },
  { value: 'subject_paper', label: 'Subject' },
  { value: 'topic_wise',    label: 'Topic' },
  { value: 'ai_generated',  label: 'AI Gen' },
];

function ScoreBubble({ value, colorFn }) {
  const color = colorFn(value) || '#888';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 48, padding: '3px 10px', borderRadius: 99,
      fontSize: 12, fontWeight: 700,
      background: color + '18', color, border: `1px solid ${color}30`,
    }}>
      {Math.round(value || 0)}%
    </span>
  );
}

function TypeChip({ type }) {
  const s = TYPE_STYLE[type] || { bg: 'var(--clr-surface2)', color: 'var(--clr-text-muted)', border: 'var(--clr-border)' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: color + '22', color, border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800, letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  );
}

export default function AdminTests() {
  const [data, setData]       = useState(null);
  const [loading, setLoad]    = useState(true);
  const [page, setPage]       = useState(1);
  const [typeFilter, setType] = useState('');
  const [deleting, setDel]    = useState(null);

  const load = () => {
    setLoad(true);
    adminAPI.getAllTests(page, 30, typeFilter)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  };

  useEffect(() => { load(); }, [page, typeFilter]);

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteTest(deleting);
      setDel(null); load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const sessions = data?.sessions || [];

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Test Sessions</h1>
          <p style={s.subtitle}>
            {loading ? 'Loading…' : `${data?.total || 0} completed tests`}
          </p>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div style={s.filterRow}>
        {FILTER_OPTIONS.map(opt => {
          const active = typeFilter === opt.value;
          return (
            <button key={opt.value} onClick={() => { setType(opt.value); setPage(1); }}
              style={{ ...s.chip, ...(active ? s.chipActive : {}) }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={s.spinnerWrap}><Spinner size={28} /></div>
      ) : sessions.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          <p style={s.emptyTitle}>No test sessions found</p>
          <p style={s.emptyText}>Try changing the filter above.</p>
        </div>
      ) : (
        <>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Student', 'Paper', 'Type', 'Score', 'Accuracy', 'Time', 'Date', ''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess, idx) => (
                  <tr key={sess._id} style={s.tr}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Student */}
                    <td style={s.td}>
                      <div style={s.studentCell}>
                        <Avatar name={sess.user?.name} />
                        <div>
                          <div style={s.studentName}>{sess.user?.name || '—'}</div>
                          <div style={s.studentEmail}>{sess.user?.email || ''}</div>
                        </div>
                      </div>
                    </td>

                    {/* Paper */}
                    <td style={{ ...s.td, maxWidth: 180 }}>
                      <div style={s.paperTitle}>{sess.paper_title}</div>
                    </td>

                    {/* Type */}
                    <td style={s.td}>
                      <TypeChip type={sess.test_type} />
                    </td>

                    {/* Score */}
                    <td style={s.td}>
                      <ScoreBubble value={sess.score?.percent} colorFn={scoreColor} />
                    </td>

                    {/* Accuracy */}
                    <td style={s.td}>
                      <ScoreBubble value={sess.accuracy} colorFn={accuracyColor} />
                    </td>

                    {/* Time */}
                    <td style={s.td}>
                      <span style={s.timeText}>
                        {sess.time_taken_sec ? formatTime(sess.time_taken_sec) : '—'}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={s.td}>
                      <div style={s.dateText}>
                        {new Date(sess.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={s.yearText}>
                        {new Date(sess.createdAt).getFullYear()}
                      </div>
                    </td>

                    {/* Delete */}
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <button onClick={() => setDel(sess._id)} style={s.delBtn}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {data?.pages > 1 && (
            <div style={s.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ ...s.pageBtn, ...(page === 1 ? s.pageBtnDisabled : {}) }}>
                ← Prev
              </button>

              <div style={s.pageNumbers}>
                {buildPageRange(page, data.pages).map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} style={s.ellipsis}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ ...s.pageNum, ...(page === p ? s.pageNumActive : {}) }}>
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
                style={{ ...s.pageBtn, ...(page === data.pages ? s.pageBtnDisabled : {}) }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Delete confirm modal ── */}
      {deleting && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalIconWrap}>🗑️</div>
            <h2 style={s.modalTitle}>Delete test session?</h2>
            <p style={s.modalText}>This action cannot be undone. The session record will be permanently removed.</p>
            <div style={s.modalActions}>
              <button onClick={confirmDelete} style={s.dangerBtn}>Yes, delete</button>
              <button onClick={() => setDel(null)} style={s.ghostBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Returns a smart page range like [1, '…', 4, 5, 6, '…', 12] */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

/* ── Styles ── */
const s = {
  page: {
    padding: '32px 32px 60px',
    maxWidth: 1200,
    margin: '0 auto',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  header: { marginBottom: 22 },
  title: {
    fontSize: 22, fontWeight: 700, margin: 0,
    color: 'var(--clr-text)', letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: 13, color: 'var(--clr-text-muted)', margin: '4px 0 0',
  },

  filterRow: { display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' },
  chip: {
    padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: '1px solid var(--clr-border)',
    background: 'transparent', color: 'var(--clr-text-muted)',
    transition: 'all .12s',
  },
  chipActive: {
    background: '#f59e0b', border: '1px solid #f59e0b',
    color: '#000',
  },

  spinnerWrap: { display: 'flex', justifyContent: 'center', padding: 80 },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '80px 0', background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)', borderRadius: 12,
  },
  emptyIcon:  { fontSize: 36, marginBottom: 12, opacity: 0.5 },
  emptyTitle: { fontSize: 15, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 6px' },
  emptyText:  { fontSize: 13, color: 'var(--clr-text-muted)', margin: 0 },

  tableWrap: {
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 12, overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: {
    borderBottom: '1px solid var(--clr-border)',
    background: 'var(--clr-surface2)',
  },
  th: {
    padding: '10px 14px', textAlign: 'left',
    fontSize: 10, fontWeight: 700,
    color: 'var(--clr-text-muted)',
    textTransform: 'uppercase', letterSpacing: '.07em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid var(--clr-border)',
    transition: 'background .1s',
  },
  td: { padding: '10px 14px', verticalAlign: 'middle' },

  studentCell: { display: 'flex', alignItems: 'center', gap: 10 },
  studentName: { fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', whiteSpace: 'nowrap' },
  studentEmail: { fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 1 },

  paperTitle: {
    fontSize: 12, color: 'var(--clr-text)', lineHeight: 1.45,
    overflow: 'hidden', textOverflow: 'ellipsis',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  },

  timeText: { fontSize: 12, color: 'var(--clr-text-muted)', fontVariantNumeric: 'tabular-nums' },
  dateText: { fontSize: 12, color: 'var(--clr-text)', fontWeight: 600 },
  yearText: { fontSize: 10, color: 'var(--clr-text-muted)', marginTop: 1 },

  delBtn: {
    padding: '4px 11px', borderRadius: 6,
    border: '1px solid rgba(239,68,68,.3)',
    background: 'rgba(239,68,68,.07)',
    color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    transition: 'background .1s',
  },

  /* Pagination */
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20,
  },
  pageNumbers: { display: 'flex', gap: 4, alignItems: 'center' },
  pageNum: {
    width: 34, height: 34, borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    color: 'var(--clr-text-muted)',
    transition: 'all .1s',
  },
  pageNumActive: {
    background: '#f59e0b', border: '1px solid #f59e0b', color: '#000',
  },
  pageBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', background: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)',
    transition: 'all .1s',
  },
  pageBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  ellipsis: { fontSize: 13, color: 'var(--clr-text-muted)', padding: '0 4px' },

  /* Delete modal */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 16,
  },
  modal: {
    background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
    borderRadius: 16, padding: '32px 28px', maxWidth: 380, width: '100%',
    textAlign: 'center',
  },
  modalIconWrap: { fontSize: 40, marginBottom: 14 },
  modalTitle: {
    fontSize: 17, fontWeight: 700, color: 'var(--clr-text)',
    margin: '0 0 10px', fontFamily: 'var(--font-display, inherit)',
  },
  modalText: {
    fontSize: 13, color: 'var(--clr-text-muted)',
    margin: '0 0 24px', lineHeight: 1.6,
  },
  modalActions: { display: 'flex', gap: 8, justifyContent: 'center' },
  dangerBtn: {
    padding: '9px 20px', background: '#ef4444', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  ghostBtn: {
    padding: '9px 20px', background: 'var(--clr-surface2)', color: 'var(--clr-text)',
    border: '1px solid var(--clr-border)', borderRadius: 8,
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  },
};