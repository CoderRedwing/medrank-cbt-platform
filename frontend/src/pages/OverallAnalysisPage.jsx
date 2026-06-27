import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { Spinner } from '../components/ui/index.jsx';
import { accuracyColor, scoreColor, priorityStyle } from '../utils/helpers';

// ── Shared components ────────────────────────────────────────────────────────

function Section({ children, style }) {
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

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--clr-text)',
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function SubjectBar({ subject, accuracy, color }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
        <span style={{ color: 'var(--clr-text)' }}>{subject}</span>
        <span style={{ fontWeight: 600, color }}>{accuracy}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--clr-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${accuracy}%`,
          background: color, borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 10,
      padding: '15px 16px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 500,
        color: 'var(--clr-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 600,
        color, letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
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

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--clr-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: payload[0]?.fill, fontWeight: 500 }}>
        Accuracy: {Math.round(payload[0]?.value)}%
      </div>
    </div>
  );
}

// ── Priority badge config ────────────────────────────────────────────────────
const PRIORITY = {
  critical: { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', bar: '#dc2626', label: 'Critical' },
  high:     { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', bar: '#d97706', label: 'High'     },
  medium:   { bg: '#f0fdf4', border: '#86efac', color: '#166534', bar: '#16a34a', label: 'Medium'   },
};

// ── Main page ────────────────────────────────────────────────────────────────
export default function OverallAnalysisPage() {
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();

  useEffect(() => {
    dashboardAPI.get()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={32} />
    </div>
  );

  const { subjectSummary, scoreTrend, weakAreas, strongAreas } = data || {};
  const stats = data?.user?.stats || {};

  const trendData = (scoreTrend || []).map((t, i) => ({
    name: `T${i + 1}`,
    accuracy: t.accuracy,
    score: Math.round(t.score?.percent || 0),
  }));

  const barData = (subjectSummary || []).slice(0, 14).map((s) => ({
    name: s.subject.length > 9 ? s.subject.slice(0, 9) : s.subject,
    fullName: s.subject,
    accuracy: s.accuracy,
  }));

  const focusSuggestions = (subjectSummary || [])
    .filter((s) => s.attempted >= 5 && s.accuracy < 60)
    .map((s) => ({
      subject: s.subject,
      reason: `${s.accuracy}% accuracy · ${s.weightage || '—'}% exam weightage`,
      priority: s.accuracy < 40 && (s.weightage || 0) >= 5
        ? 'critical' : s.accuracy < 55 ? 'high' : 'medium',
    }))
    .sort((a, b) =>
      ({ critical: 0, high: 1, medium: 2 }[a.priority] -
       { critical: 0, high: 1, medium: 2 }[b.priority])
    );

  const totalAttempted = (stats.totalCorrect || 0) + (stats.totalIncorrect || 0);

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 28px) 48px', maxWidth: 1050, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: 'var(--clr-text)', letterSpacing: '-0.02em',
        }}>
          Overall analysis
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, marginTop: 4 }}>
          Cumulative performance across all{' '}
          <span style={{ fontWeight: 500, color: 'var(--clr-text)' }}>
            {stats.totalTestsTaken || 0}
          </span>{' '}
          completed tests
        </p>
      </div>

      {/* ── Stat cards — grouped surface ── */}
      <div style={{
        background: 'var(--clr-surface)',
        border: '1px solid var(--clr-border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 18,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 0,
        }}>
          {[
            {
              label: 'Total correct',
              value: (stats.totalCorrect || 0).toLocaleString(),
              color: '#16a34a',
              sub: totalAttempted > 0 ? `of ${totalAttempted.toLocaleString()} attempted` : undefined,
            },
            {
              label: 'Total incorrect',
              value: (stats.totalIncorrect || 0).toLocaleString(),
              color: '#dc2626',
            },
            {
              label: 'Avg accuracy',
              value: `${stats.averageAccuracy || 0}%`,
              color: accuracyColor(stats.averageAccuracy),
            },
            {
              label: 'Avg score / paper',
              value: stats.averageScore || 0,
              color: '#6366f1',
            },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                padding: '10px 8px',
                borderRight: i < arr.length - 1 ? '1px solid var(--clr-border)' : 'none',
              }}
            >
              <div style={{
                fontSize: 10, color: 'var(--clr-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 24, fontWeight: 600,
                color: s.color, letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {s.value}
              </div>
              {s.sub && (
                <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 4 }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Score trend ── */}
      {trendData.length > 1 && (
        <Section style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SectionTitle>Score trend</SectionTitle>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { color: '#6366f1', label: 'Accuracy %' },
                { color: '#f59e0b', label: 'Score %' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 18, height: 2, background: color, display: 'inline-block', borderRadius: 99 }} />
                  <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} name="Accuracy %" />
              <Line type="monotone" dataKey="score"    stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} name="Score %" />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Subject bar chart ── */}
      {barData.length > 0 && (
        <Section style={{ marginBottom: 14 }}>
          <SectionTitle>Subject-wise accuracy</SectionTitle>
          <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 26)}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 8 }}
              barSize={10}
            >
              <XAxis
                type="number" domain={[0, 100]}
                tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category" dataKey="name"
                tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }}
                width={72} axisLine={false} tickLine={false}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--clr-surface2)' }} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} label={{
                position: 'right', fill: 'var(--clr-text-muted)', fontSize: 10,
                formatter: (v) => `${v}%`,
              }}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={accuracyColor(entry.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* ── Weak / Strong ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: 14, marginBottom: 14,
      }}>
        <Section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#fef2f2', border: '1px solid #fca5a5',
              display: 'grid', placeItems: 'center',
              fontSize: 10, color: '#dc2626', flexShrink: 0,
            }}>!</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#dc2626' }}>Weakest subjects</span>
          </div>
          {weakAreas?.length ? weakAreas.map((s) => (
            <SubjectBar key={s.subject} subject={s.subject} accuracy={s.accuracy} color="#ef4444" />
          )) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No weak areas detected yet.</p>
          )}
        </Section>

        <Section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#f0fdf4', border: '1px solid #86efac',
              display: 'grid', placeItems: 'center',
              fontSize: 10, color: '#16a34a', flexShrink: 0,
            }}>✓</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>Strongest subjects</span>
          </div>
          {strongAreas?.length ? strongAreas.map((s) => (
            <SubjectBar key={s.subject} subject={s.subject} accuracy={s.accuracy} color="#16a34a" />
          )) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>Attempt more tests to see strong areas.</p>
          )}
        </Section>
      </div>

      {/* ── Focus plan ── */}
      {focusSuggestions.length > 0 && (
        <Section>
          <SectionTitle>Recommended focus areas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {focusSuggestions.slice(0, 8).map((f, i) => {
              const p = PRIORITY[f.priority] || PRIORITY.medium;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--clr-surface2)',
                  border: '1px solid var(--clr-border)',
                  borderLeft: `3px solid ${p.bar}`,
                }}>
                  {/* Priority pill — consistent with AnalysisPage style */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 99,
                    fontSize: 11, fontWeight: 600,
                    background: p.bg, border: `1px solid ${p.border}`,
                    color: p.color, flexShrink: 0,
                  }}>
                    {p.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text)' }}>
                      {f.subject}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                      {f.reason}
                    </div>
                  </div>
                  {/* Practice button — consistent pill style */}
                  <button
                    onClick={() => navigate('/tests')}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      color: 'var(--clr-primary)',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 99,
                      padding: '4px 12px',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.16)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                  >
                    Practice →
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}