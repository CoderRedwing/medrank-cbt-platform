import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { Card, Spinner, Badge, ProgressBar } from '../components/ui/index.jsx';
import { formatTime, accuracyColor, scoreColor } from '../utils/helpers';

export default function DashboardPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const navigate            = useNavigate();

  useEffect(() => {
    dashboardAPI.get()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={36} />
    </div>
  );

  const { user, recentTests, scoreTrend, subjectSummary, weakAreas, strongAreas } = data || {};
  const stats = user?.stats || {};

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', marginTop: 4, fontSize: 14 }}>
          Target: <strong style={{ color: 'var(--clr-primary)' }}>{user?.targetExam?.replace('_', ' ')}</strong>
          {stats.totalTestsTaken > 0 && ` · ${stats.totalTestsTaken} tests completed`}
        </p>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Tests Taken',    value: stats.totalTestsTaken || 0,      color: '#6366f1' },
          { label: 'Avg Accuracy',   value: `${stats.averageAccuracy || 0}%`, color: accuracyColor(stats.averageAccuracy) },
          { label: 'Avg Score',      value: stats.averageScore || 0,         color: scoreColor(stats.averageScore > 0 ? 60 : 0) },
          { label: 'Qs Attempted',   value: stats.totalQuestionsAttempted || 0, color: '#f59e0b' },
        ].map((s) => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Score trend chart */}
        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Score Trend</h2>
          {scoreTrend?.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreTrend.map((t, i) => ({
                name: `T${i + 1}`,
                accuracy: t.accuracy,
                score: t.score?.percent,
              }))}>
                <XAxis dataKey="name" tick={{ fill: '#7c8499', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7c8499', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#171d2e', border: '1px solid #1e2638', borderRadius: 8 }}
                  labelStyle={{ color: '#e8eaf0' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Accuracy %" />
                <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Score %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', fontSize: 13 }}>
              Take at least 2 tests to see your trend
            </div>
          )}
        </Card>

        {/* Subject radar */}
        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Subject Radar</h2>
          {subjectSummary?.length > 2 ? (
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={subjectSummary.slice(0, 8).map((s) => ({ subject: s.subject.slice(0, 6), accuracy: s.accuracy }))}>
                <PolarGrid stroke="#1e2638" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7c8499', fontSize: 10 }} />
                <Radar dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', fontSize: 13 }}>
              Attempt subject tests to see radar
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Weak areas */}
        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#f87171' }}>
            ⚠ Weak Areas
          </h2>
          {weakAreas?.length ? weakAreas.map((s) => (
            <div key={s.subject} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span>{s.subject}</span>
                <span style={{ color: '#f87171', fontWeight: 600 }}>{s.accuracy}%</span>
              </div>
              <ProgressBar value={s.accuracy} color="#ef4444" height={5} />
            </div>
          )) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No weak areas detected yet — keep testing!</p>
          )}
        </Card>

        {/* Strong areas */}
        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#34d399' }}>
            ✓ Strong Areas
          </h2>
          {strongAreas?.length ? strongAreas.map((s) => (
            <div key={s.subject} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span>{s.subject}</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{s.accuracy}%</span>
              </div>
              <ProgressBar value={s.accuracy} color="#10b981" height={5} />
            </div>
          )) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No strong areas yet — keep practising!</p>
          )}
        </Card>
      </div>

      {/* Recent tests */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Recent Tests</h2>
          <button onClick={() => navigate('/history')} style={{ fontSize: 12, color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            View all →
          </button>
        </div>
        {recentTests?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTests.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate(`/analysis/${t._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--clr-surface2)', cursor: 'pointer',
                  transition: 'background 0.15s',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--clr-border2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.paper_title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {t.time_taken_sec > 0 && ` · ${formatTime(t.time_taken_sec)}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: scoreColor(t.score?.percent) }}>{Math.round(t.score?.percent || 0)}%</div>
                  <div style={{ fontSize: 11, color: accuracyColor(t.accuracy) }}>{t.accuracy}% acc</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', flexShrink: 0 }}>
                  {t.correct_count}/{t.total_questions}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--clr-text-muted)', fontSize: 13 }}>
            No tests yet.{' '}
            <button onClick={() => navigate('/tests')} style={{ color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Start your first test →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
