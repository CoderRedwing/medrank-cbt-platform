import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { adminAPI } from '../../services/api';
import { Spinner } from '../../components/ui/index.jsx';
import { accuracyColor } from '../../utils/helpers';

// ── Shared ───────────────────────────────────────────────────────────────────

function Section({ children, style }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 10,
      padding: '16px 18px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text)' }}>
        {children}
      </span>
      {action}
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
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ height = 200 }) {
  return (
    <div style={{
      height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      color: 'var(--clr-text-muted)',
      fontSize: 13,
    }}>
      <span style={{ fontSize: 22, opacity: 0.4 }}>📊</span>
      Not enough data yet
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon, delta }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: 'var(--clr-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          {label}
        </span>
        <span style={{
          width: 26, height: 26, borderRadius: 7,
          background: `${color}18`,
          display: 'grid', placeItems: 'center',
          fontSize: 13,
        }}>
          {icon}
        </span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 600,
        color, letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {value}
      </div>
      {delta !== undefined && (
        <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 5 }}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Dataset pill ──────────────────────────────────────────────────────────────
function DatasetPill({ label, value }) {
  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{label}</span>
      <span style={{
        fontSize: 18, fontWeight: 600,
        color: '#d97706',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);
  const navigate           = useNavigate();

  useEffect(() => {
    adminAPI.getStats()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={32} />
    </div>
  );
  if (!data) return null;

  const { overview, regTrend, testTrend, popularPapers, subjectStats, dataset } = data;

  // Merge reg + test trend by date
  const trendDates = [
    ...new Set([...regTrend.map((r) => r._id), ...testTrend.map((t) => t._id)]),
  ].sort();

  const mergedTrend = trendDates.map((d) => ({
    date:  d.slice(5),
    regs:  regTrend.find((r) => r._id === d)?.count  || 0,
    tests: testTrend.find((t) => t._id === d)?.count || 0,
  }));

  const barData = (subjectStats || []).slice(0, 10).map((s) => ({
    name:     s.subject.length > 9 ? s.subject.slice(0, 9) : s.subject,
    fullName: s.subject,
    accuracy: s.accuracy,
  }));

  const quickActions = [
    { label: 'View all students',    path: '/admin/students', icon: '👥' },
    { label: 'Browse test sessions', path: '/admin/tests',    icon: '📋' },
    { label: 'Edit question papers', path: '/admin/papers',   icon: '📝' },
    { label: 'Admin settings',       path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: 'var(--clr-text)', letterSpacing: '-0.02em',
        }}>
          Platform dashboard
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, marginTop: 4 }}>
          Real-time overview of students and activity
        </p>
      </div>

      {/* ── KPI row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}>
        <KpiCard label="Total students"  value={overview.totalStudents.toLocaleString()} color="#6366f1" icon="🎓" />
        <KpiCard label="New this week"   value={overview.newThisWeek}   color="#16a34a" icon="📈" delta="last 7 days" />
        <KpiCard label="Tests today"     value={overview.testsToday}    color="#d97706" icon="📝" />
        <KpiCard label="Total tests"     value={overview.totalTests.toLocaleString()} color="#0ea5e9" icon="📊" />
        <KpiCard label="Active now"      value={overview.activeNow}     color="#10b981" icon="🟢" />
        <KpiCard
          label="Avg accuracy"
          value={`${overview.avgAccuracy}%`}
          color={accuracyColor(overview.avgAccuracy)}
          icon="🎯"
        />
      </div>

      {/* ── Dataset info ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}>
        <DatasetPill label="Full papers in dataset"  value={dataset.fullPapers}    />
        <DatasetPill label="Subject papers"          value={dataset.subjectPapers} />
        <DatasetPill label="Topic-wise banks"        value={dataset.topicBanks}    />
      </div>

      {/* ── Charts ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: 14,
        marginBottom: 14,
      }}>

        {/* Trend line */}
        <Section>
          <SectionTitle>
            Registrations &amp; tests — last 30 days
          </SectionTitle>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            {[
              { color: '#6366f1', label: 'New students' },
              { color: '#f59e0b', label: 'Tests taken' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 18, height: 2, background: color, display: 'inline-block', borderRadius: 99 }} />
                <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>

          {mergedTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={185}>
              <LineChart data={mergedTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  interval={Math.floor(mergedTrend.length / 6)}
                />
                <YAxis
                  tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="regs"  stroke="#6366f1" strokeWidth={2} dot={false} name="New students" />
                <Line type="monotone" dataKey="tests" stroke="#f59e0b" strokeWidth={2} dot={false} name="Tests taken"  />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart height={185} />}
        </Section>

        {/* Subject accuracy */}
        <Section>
          <SectionTitle>Platform accuracy by subject</SectionTitle>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={185}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 0, right: 36, bottom: 0, left: 4 }}
                barSize={8}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
                  width={62}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const full = barData.find((b) => b.name === label)?.fullName || label;
                    return (
                      <div style={{
                        background: 'var(--clr-surface)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: 8, padding: '8px 12px', fontSize: 12,
                      }}>
                        <div style={{ color: 'var(--clr-text-muted)', marginBottom: 3 }}>{full}</div>
                        <div style={{ color: payload[0].fill, fontWeight: 500 }}>
                          Accuracy: {payload[0].value}%
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: 'var(--clr-surface2)' }}
                />
                <Bar
                  dataKey="accuracy"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    fill: 'var(--clr-text-muted)',
                    fontSize: 10,
                    formatter: (v) => `${v}%`,
                  }}
                >
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={accuracyColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart height={185} />}
        </Section>
      </div>

      {/* ── Popular papers + Quick actions ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}>

        {/* Popular papers */}
        <Section>
          <SectionTitle>Most attempted papers</SectionTitle>
          {popularPapers.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr 70px 80px',
                gap: 10,
                padding: '0 8px 8px',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--clr-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid var(--clr-border)',
                marginBottom: 4,
              }}>
                <span>#</span>
                <span>Paper</span>
                <span style={{ textAlign: 'right' }}>Attempts</span>
                <span style={{ textAlign: 'right' }}>Avg acc</span>
              </div>

              {popularPapers.slice(0, 6).map((p, i) => (
                <div
                  key={p._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 70px 80px',
                    gap: 10,
                    alignItems: 'center',
                    padding: '8px 8px',
                    borderRadius: 7,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--clr-surface2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-text-muted)' }}>
                    {i + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: 'var(--clr-text)',
                    }}>
                      {p.title || p._id}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--clr-text-muted)' }}>
                    {p.count}
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontSize: 12,
                    fontWeight: 500,
                    color: accuracyColor(Math.round(p.avgAccuracy || 0)),
                  }}>
                    {Math.round(p.avgAccuracy || 0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>No tests taken yet.</p>
          )}
        </Section>

        {/* Quick actions */}
        <Section>
          <SectionTitle>Quick actions</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--clr-surface2)',
                  border: '1px solid var(--clr-border)',
                  color: 'var(--clr-text)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.12s',
                  width: '100%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--clr-border)'}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>{a.icon}</span>
                {a.label}
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 14,
                  color: 'var(--clr-text-muted)',
                  opacity: 0.5,
                }}>
                  →
                </span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}