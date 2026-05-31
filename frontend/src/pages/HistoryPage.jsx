import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import { Card, Spinner, Badge, ProgressBar } from '../components/ui/index.jsx';
import { formatTime, accuracyColor, scoreColor } from '../utils/helpers';

export default function HistoryPage() {
  const [data, setData]   = useState(null);
  const [page, setPage]   = useState(1);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();

  useEffect(() => {
    setLoad(true);
    testAPI.getHistory(page, 20)
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page]);

  const typeColor = { full_paper: 'indigo', subject_paper: 'blue', topic_wise: 'green', ai_generated: 'amber' };
  const typeLabel = { full_paper: 'Full Paper', subject_paper: 'Subject', topic_wise: 'Topic', ai_generated: 'AI Gen' };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Test History</h1>
      <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 24 }}>
        {data?.total ? `${data.total} tests completed` : 'All your past tests'}
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : !data?.sessions?.length ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: 16 }}>No tests yet.</p>
            <button
              onClick={() => navigate('/tests')}
              style={{ color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Start your first test →
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.sessions.map((t) => (
              <Card
                key={t._id}
                onClick={() => navigate(`/analysis/${t._id}`)}
                style={{ cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', alignItems: 'center', gap: 16 }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--clr-border2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--clr-border)'}
              >
                {/* Type badge */}
                <div style={{ flexShrink: 0 }}>
                  <Badge color={typeColor[t.test_type] || 'gray'}>{typeLabel[t.test_type] || t.test_type}</Badge>
                </div>

                {/* Title + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.paper_title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {t.time_taken_sec > 0 && ` · ${formatTime(t.time_taken_sec)}`}
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ width: 100, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginBottom: 3 }}>
                    Score: {Math.round(t.score?.percent || 0)}%
                  </div>
                  <ProgressBar value={t.score?.percent || 0} color={scoreColor(t.score?.percent)} height={5} />
                </div>

                {/* Accuracy */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: accuracyColor(t.accuracy) }}>
                    {t.accuracy}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>
                    {t.correct_count}/{t.total_questions}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p} onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: page === p ? 'var(--clr-primary)' : 'var(--clr-surface)',
                    border: `1px solid ${page === p ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    color: page === p ? '#fff' : 'var(--clr-text-muted)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
