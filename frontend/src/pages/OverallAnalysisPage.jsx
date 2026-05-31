import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { testAPI, dashboardAPI } from '../services/api';
import { Card, Spinner, ProgressBar } from '../components/ui/index.jsx';
import { accuracyColor, scoreColor, priorityStyle } from '../utils/helpers';
import { EXAM_WEIGHTAGE } from '../utils/examData';

export default function OverallAnalysisPage() {
  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();

  useEffect(() => {
    dashboardAPI.get()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div>;

  const { subjectSummary, scoreTrend, weakAreas, strongAreas } = data || {};
  const stats = data?.user?.stats || {};

  const focusSuggestions = (subjectSummary || [])
    .filter((s) => s.attempted >= 5 && s.accuracy < 60)
    .map((s) => ({
      subject: s.subject,
      reason: `${s.accuracy}% accuracy · ${s.weightage}% exam weightage`,
      priority: s.accuracy < 40 && s.weightage >= 5 ? 'critical' : s.accuracy < 55 ? 'high' : 'medium',
    }))
    .sort((a, b) => ({ critical: 0, high: 1, medium: 2 }[a.priority] - { critical: 0, high: 1, medium: 2 }[b.priority]));

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1050, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Overall Analysis</h1>
      <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 28 }}>
        Cumulative performance across all {stats.totalTestsTaken || 0} completed tests
      </p>

      {/* Global stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Correct',    value: stats.totalCorrect || 0,          color: '#10b981' },
          { label: 'Total Incorrect',  value: stats.totalIncorrect || 0,        color: '#ef4444' },
          { label: 'Avg Accuracy',     value: `${stats.averageAccuracy || 0}%`, color: accuracyColor(stats.averageAccuracy) },
          { label: 'Avg Score/Paper',  value: stats.averageScore || 0,          color: '#6366f1' },
        ].map((s) => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Score trend */}
      {scoreTrend?.length > 1 && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Score Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreTrend.map((t, i) => ({ name: `T${i + 1}`, accuracy: t.accuracy, score: Math.round(t.score?.percent || 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" />
              <XAxis dataKey="name" tick={{ fill: '#7c8499', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7c8499', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#171d2e', border: '1px solid #1e2638', borderRadius: 8 }} />
              <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Accuracy %" />
              <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Score %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Subject bar chart */}
      {subjectSummary?.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Subject-wise Accuracy (All Tests)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectSummary.slice(0, 12).map((s) => ({ name: s.subject.slice(0, 8), accuracy: s.accuracy, weight: s.weightage }))} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#7c8499', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#e8eaf0', fontSize: 11 }} width={65} />
              <Tooltip contentStyle={{ background: '#171d2e', border: '1px solid #1e2638', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}
                label={{ position: 'right', fill: '#7c8499', fontSize: 10, formatter: (v) => `${v}%` }}>
                {subjectSummary.slice(0, 12).map((s, i) => (
                  <rect key={i} fill={accuracyColor(s.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Weak / Strong */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#f87171', marginBottom: 14 }}>⚠ Weakest Subjects</h3>
          {weakAreas?.length ? weakAreas.map((s) => (
            <div key={s.subject} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span>{s.subject}</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>{s.accuracy}%</span>
              </div>
              <ProgressBar value={s.accuracy} color="#ef4444" height={5} />
            </div>
          )) : <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No weak areas yet!</p>}
        </Card>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#34d399', marginBottom: 14 }}>✓ Strongest Subjects</h3>
          {strongAreas?.length ? strongAreas.map((s) => (
            <div key={s.subject} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span>{s.subject}</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{s.accuracy}%</span>
              </div>
              <ProgressBar value={s.accuracy} color="#10b981" height={5} />
            </div>
          )) : <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>Attempt more tests!</p>}
        </Card>
      </div>

      {/* Focus plan */}
      {focusSuggestions.length > 0 && (
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📌 Recommended Focus Areas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {focusSuggestions.slice(0, 8).map((f, i) => {
              const ps = priorityStyle(f.priority);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--clr-surface2)', borderLeft: `3px solid ${ps.text}` }}>
                  <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.text, flexShrink: 0 }}>{ps.label}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{f.reason}</div>
                  </div>
                  <button
                    onClick={() => navigate('/tests')}
                    style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Practice →
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
