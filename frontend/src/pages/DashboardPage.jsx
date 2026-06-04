import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { Spinner } from '../components/ui/index.jsx';
import { formatTime, accuracyColor, scoreColor } from '../utils/helpers';

// ── Inline mini components (no external Card dependency needed) ──────────────

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 10,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11,
          color: 'var(--clr-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          fontWeight: 500,
        }}>
          {label}
        </span>
        <span style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${color}18`,
          display: 'grid', placeItems: 'center',
          fontSize: 14,
        }}>
          {icon}
        </span>
      </div>
      <div style={{
        fontSize: 26,
        fontWeight: 600,
        color,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({ children, style }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 10,
      padding: '18px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 600,
      color: color || 'var(--clr-text)',
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      {children}
    </div>
  );
}

function SubjectBar({ subject, accuracy, color }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 5,
        fontSize: 13,
      }}>
        <span style={{ color: 'var(--clr-text)' }}>{subject}</span>
        <span style={{ fontWeight: 600, color }}>{accuracy}%</span>
      </div>
      <div style={{
        height: 4,
        background: 'var(--clr-border)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${accuracy}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// ── Custom tooltip for charts ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--clr-text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {Math.round(p.value)}%
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();
  const location           = useLocation();

  useEffect(() => {
    setLoad(true);
    dashboardAPI.get()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [location.pathname]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={32} />
    </div>
  );

  const { user, recentTests, scoreTrend, subjectSummary, weakAreas, strongAreas } = data || {};
  const stats = user?.stats || {};

  const trendData = (scoreTrend || []).map((t, i) => ({
    name: `T${i + 1}`,
    accuracy: t.accuracy,
    score: Math.round(t.score?.percent || 0),
  }));

  const radarData = (subjectSummary || [])
    .slice(0, 8)
    .map((s) => ({
      subject: s.subject.length > 7 ? s.subject.slice(0, 7) : s.subject,
      accuracy: s.accuracy,
    }));

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1080, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--clr-text)',
          letterSpacing: '-0.02em',
        }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', marginTop: 4, fontSize: 13 }}>
          Target:{' '}
          <span style={{ color: '#6366f1', fontWeight: 500 }}>
            {user?.targetExam?.replace('_', ' ')}
          </span>
          {stats.totalTestsTaken > 0 && (
            <span> · {stats.totalTestsTaken} tests completed</span>
          )}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        <StatCard
          label="Tests taken"
          value={stats.totalTestsTaken || 0}
          color="#6366f1"
          icon="📋"
        />
        <StatCard
          label="Avg accuracy"
          value={`${stats.averageAccuracy || 0}%`}
          color={accuracyColor(stats.averageAccuracy)}
          icon="🎯"
        />
        <StatCard
          label="Avg score"
          value={stats.averageScore || 0}
          color={scoreColor(stats.averageScore > 0 ? 60 : 0)}
          icon="📈"
        />
        <StatCard
          label="Qs attempted"
          value={(stats.totalQuestionsAttempted || 0).toLocaleString()}
          color="#d97706"
          icon="✏️"
        />
      </div>

      {/* ── Charts row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: 14,
        marginBottom: 14,
      }}>

        {/* Score trend */}
        <SectionCard>
          <SectionTitle>Score trend</SectionTitle>
          {trendData.length > 1 ? (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                {[
                  { color: '#6366f1', label: 'Accuracy %' },
                  { color: '#f59e0b', label: 'Score %' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 20, height: 2, background: color, display: 'inline-block', borderRadius: 99 }} />
                    <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                    name="Accuracy %"
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
                    name="Score %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{
              height: 170,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--clr-text-muted)',
              fontSize: 13,
            }}>
              <span style={{ fontSize: 24 }}>📊</span>
              Take at least 2 tests to see your trend
            </div>
          )}
        </SectionCard>

        {/* Subject radar */}
        <SectionCard>
          <SectionTitle>Subject radar</SectionTitle>
          {radarData.length > 2 ? (
            <ResponsiveContainer width="100%" height={190}>
              <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <PolarGrid stroke="var(--clr-border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
                />
                <Radar
                  dataKey="accuracy"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 190,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--clr-text-muted)',
              fontSize: 13,
            }}>
              <span style={{ fontSize: 24 }}>🕸️</span>
              Attempt subject tests to see radar
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Weak / Strong areas ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        marginBottom: 14,
      }}>

        {/* Weak areas */}
        <SectionCard>
          <SectionTitle color="#dc2626">
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#fef2f2', border: '1px solid #fca5a5',
              display: 'grid', placeItems: 'center',
              fontSize: 10, color: '#dc2626', flexShrink: 0,
            }}>!</span>
            Weak areas
          </SectionTitle>
          {weakAreas?.length ? weakAreas.map((s) => (
            <SubjectBar
              key={s.subject}
              subject={s.subject}
              accuracy={s.accuracy}
              color="#ef4444"
            />
          )) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
              No weak areas detected yet — keep testing!
            </p>
          )}
        </SectionCard>

        {/* Strong areas */}
        <SectionCard>
          <SectionTitle color="#16a34a">
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#f0fdf4', border: '1px solid #86efac',
              display: 'grid', placeItems: 'center',
              fontSize: 10, color: '#16a34a', flexShrink: 0,
            }}>✓</span>
            Strong areas
          </SectionTitle>
          {strongAreas?.length ? strongAreas.map((s) => (
            <SubjectBar
              key={s.subject}
              subject={s.subject}
              accuracy={s.accuracy}
              color="#16a34a"
            />
          )) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
              No strong areas yet — keep practising!
            </p>
          )}
        </SectionCard>
      </div>

      {/* ── Recent tests ── */}
      <SectionCard>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}>
          <SectionTitle style={{ marginBottom: 0 }}>Recent tests</SectionTitle>
          <button
            onClick={() => navigate('/history')}
            style={{
              fontSize: 12,
              color: '#6366f1',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              padding: 0,
            }}
          >
            View all →
          </button>
        </div>

        {recentTests?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 70px 60px',
              gap: 12,
              padding: '0 12px 8px',
              fontSize: 11,
              color: 'var(--clr-text-muted)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '1px solid var(--clr-border)',
              marginBottom: 4,
            }}>
              <span>Test</span>
              <span style={{ textAlign: 'right' }}>Score</span>
              <span style={{ textAlign: 'right' }}>Accuracy</span>
              <span style={{ textAlign: 'right' }}>Qs</span>
            </div>

            {recentTests.map((t) => {
              const scorePct   = Math.round(t.score?.percent || 0);
              const sColor     = scoreColor(scorePct);
              const aColor     = accuracyColor(t.accuracy);
              return (
                <div
                  key={t._id}
                  onClick={() => navigate(`/analysis/${t._id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 70px 60px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--clr-surface2)';
                    e.currentTarget.style.borderColor = 'var(--clr-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  {/* Title + date */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--clr-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {t.paper_title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {t.time_taken_sec > 0 && ` · ${formatTime(t.time_taken_sec)}`}
                    </div>
                  </div>

                  {/* Score % */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: sColor }}>{scorePct}%</span>
                  </div>

                  {/* Accuracy */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: aColor }}>{t.accuracy}%</span>
                  </div>

                  {/* Correct/total */}
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--clr-text-muted)' }}>
                    {t.correct_count}/{t.total_questions}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '28px 0',
            color: 'var(--clr-text-muted)',
            fontSize: 13,
          }}>
            No tests yet.{' '}
            <button
              onClick={() => navigate('/tests')}
              style={{
                color: '#6366f1',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Start your first test →
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}