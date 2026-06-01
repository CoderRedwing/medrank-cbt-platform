import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import { Card, Spinner, ProgressBar, Badge } from '../components/ui/index.jsx';
import { formatTime, accuracyColor, scoreColor } from '../utils/helpers';

const TYPE_COLOR = { full_paper: 'indigo', subject_paper: 'blue', topic_wise: 'green', ai_generated: 'amber' };
const TYPE_LABEL = { full_paper: 'Full Paper', subject_paper: 'Subject', topic_wise: 'Topic', ai_generated: 'AI Gen' };

export default function HistoryPage() {
  const [data, setData]    = useState(null);
  const [page, setPage]    = useState(1);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();

  useEffect(() => {
    setLoad(true);
    testAPI.getHistory(page, 20)
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page]);

  // Compute average accuracy from current page sessions
  const avgAccuracy = data?.sessions?.length
    ? Math.round(data.sessions.reduce((a, t) => a + (t.accuracy || 0), 0) / data.sessions.length)
    : null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 6 }}>
          Test History
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 14, color: 'var(--clr-text-muted)' }}>
          {data?.total ? (
            <>
              <span>{data.total} tests completed</span>
              {avgAccuracy !== null && (
                <>
                  <span style={{ color: 'var(--clr-border2)' }}>·</span>
                  <span>
                    Avg accuracy:&nbsp;
                    <strong style={{ color: accuracyColor(avgAccuracy) }}>{avgAccuracy}%</strong>
                  </span>
                </>
              )}
            </>
          ) : (
            <span>All your past tests</span>
          )}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spinner size={32} />
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!loading && !data?.sessions?.length && (
        <div style={{
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          borderRadius: 14, padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 18,
            fontWeight: 600, color: 'var(--clr-text)', marginBottom: 8,
          }}>
            No tests yet
          </p>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 24 }}>
            Complete your first test to see your history here
          </p>
          <button
            onClick={() => navigate('/tests')}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: 'var(--clr-primary)', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
            }}
          >
            Start a test →
          </button>
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────── */}
      {!loading && data?.sessions?.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.sessions.map((t) => (
              <TestRow key={t._id} t={t} onClick={() => navigate(`/analysis/${t._id}`)} />
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <PaginationBtn label="←" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <PaginationBtn key={p} label={p} onClick={() => setPage(p)} active={page === p} />
              ))}
              <PaginationBtn label="→" onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Single test row ─────────────────────────────────────────────── */
function TestRow({ t, onClick }) {
  const [hovered, setHovered] = useState(false);
  const accuracy  = t.accuracy || 0;
  const scorePct  = Math.round(t.score?.percent || 0);
  const date      = new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--clr-surface)',
        border: `1px solid ${hovered ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
      }}
    >
      {/* Type badge */}
      <div style={{ flexShrink: 0, width: 76 }}>
        <Badge color={TYPE_COLOR[t.test_type] || 'gray'}>
          {TYPE_LABEL[t.test_type] || t.test_type}
        </Badge>
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--clr-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {t.paper_title}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--clr-text-muted)' }}>
          <span>📅 {date}</span>
          {t.time_taken_sec > 0 && <span>⏱ {formatTime(t.time_taken_sec)}</span>}
          <span>📝 {t.correct_count}/{t.total_questions} correct</span>
        </div>
      </div>

      {/* Score */}
      <div style={{ width: 90, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>Score</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(scorePct) }}>
            {scorePct}%
          </span>
        </div>
        <ProgressBar value={scorePct} color={scoreColor(scorePct)} height={5} />
      </div>

      {/* Accuracy */}
      <div style={{ textAlign: 'center', flexShrink: 0, width: 60 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: accuracyColor(accuracy) }}>
          {accuracy}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>accuracy</div>
      </div>

      {/* Arrow */}
      <div style={{
        fontSize: 20, color: hovered ? 'var(--clr-primary)' : 'var(--clr-text-dim)',
        flexShrink: 0, transition: 'color 0.15s',
      }}>
        ›
      </div>
    </div>
  );
}

/* ── Pagination button ───────────────────────────────────────────── */
function PaginationBtn({ label, onClick, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 36, height: 36, borderRadius: 8, padding: '0 10px',
        background: active ? 'var(--clr-primary)' : 'var(--clr-surface)',
        border: `1px solid ${active ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
        color: active ? '#fff' : disabled ? 'var(--clr-text-dim)' : 'var(--clr-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 600,
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}