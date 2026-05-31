import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { testAPI } from '../services/api';
import { Card, Btn, Spinner, ProgressBar, Badge } from '../components/ui/index.jsx';
import { formatTime, accuracyColor, scoreColor, difficultyColor, priorityStyle } from '../utils/helpers';

const DIFF_ORDER = ['Easy', 'Moderate', 'Hard', 'Very Hard'];

export default function AnalysisPage() {
  const { sessionId }           = useParams();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setTab]     = useState('overview');
  const [reviewFilter, setRF]   = useState('all'); // all | correct | incorrect | unattempted
  const navigate                = useNavigate();

  useEffect(() => {
    testAPI.getAnalysis(sessionId)
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div>
  );
  if (!data) return <div style={{ padding: 40, color: 'var(--clr-text-muted)' }}>Analysis not found.</div>;

  const {
    paper_title, submitted_at, time_taken_sec, duration_allowed_sec,
    total_questions, score, correct_count, incorrect_count, unattempted_count, accuracy,
    subject_analysis, topic_analysis, difficulty_analysis, weak_subjects, weak_topics,
    focus_suggestions, responses,
  } = data;

  const subjectData = Object.entries(subject_analysis || {})
    .map(([s, d]) => ({ subject: s.slice(0, 10), accuracy: d.accuracy, correct: d.correct, attempted: d.attempted }))
    .sort((a, b) => b.attempted - a.attempted);

  const diffData = DIFF_ORDER
    .filter((d) => difficulty_analysis?.[d])
    .map((d) => ({
      name: d,
      accuracy: difficulty_analysis[d].accuracy,
      correct: difficulty_analysis[d].correct,
      total: difficulty_analysis[d].total,
    }));

  const filteredResponses = (responses || []).filter((r) => {
    if (reviewFilter === 'correct')     return r.is_correct;
    if (reviewFilter === 'incorrect')   return r.is_attempted && !r.is_correct;
    if (reviewFilter === 'unattempted') return !r.is_attempted;
    return true;
  });

  const TABS = ['overview', 'subjects', 'topics', 'questions', 'focus'];
  const TAB_LABELS = { overview: 'Overview', subjects: 'Subjects', topics: 'Topics', questions: 'Review Qs', focus: 'Focus Plan' };

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1050, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{paper_title}</h1>
          <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', marginTop: 4 }}>
            {new Date(submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            {time_taken_sec > 0 && ` · Time taken: ${formatTime(time_taken_sec)}`}
          </p>
        </div>
        <Btn variant="secondary" onClick={() => navigate('/tests')}>New Test</Btn>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Score',       value: score.raw,            sub: `/ ${score.max}`,       color: scoreColor(score.percent) },
          { label: 'Score %',     value: `${score.percent}%`,  sub: 'of max possible',       color: scoreColor(score.percent) },
          { label: 'Accuracy',    value: `${accuracy}%`,       sub: 'of attempted',          color: accuracyColor(accuracy) },
          { label: 'Correct',     value: correct_count,        sub: `of ${total_questions}`,  color: '#10b981' },
          { label: 'Incorrect',   value: incorrect_count,      sub: `−${incorrect_count} marks`, color: '#ef4444' },
        ].map((s) => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--clr-border)' }}>
        {TABS.map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              color: activeTab === t ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              borderBottom: `2px solid ${activeTab === t ? 'var(--clr-primary)' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Answered pie */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Attempt Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[
                  { name: 'Correct',     value: correct_count,     color: '#10b981' },
                  { name: 'Incorrect',   value: incorrect_count,   color: '#ef4444' },
                  { name: 'Unattempted', value: unattempted_count, color: '#2a3450' },
                ]} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                  {[{ color: '#10b981' }, { color: '#ef4444' }, { color: '#2a3450' }].map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#171d2e', border: '1px solid #1e2638', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Difficulty breakdown */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Accuracy by Difficulty</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {diffData.map((d) => {
                const dc = difficultyColor(d.name);
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: dc.text, fontWeight: 600 }}>{d.name}</span>
                      <span style={{ color: 'var(--clr-text-muted)' }}>{d.correct}/{d.total} · {d.accuracy}%</span>
                    </div>
                    <ProgressBar value={d.accuracy} color={dc.text} height={6} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Weak subjects */}
          {weak_subjects?.length > 0 && (
            <Card style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#f87171', marginBottom: 12 }}>
                ⚠ Weak Subjects
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {weak_subjects.map((s) => (
                  <span key={s} style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Time usage */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Time Usage</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Used</span>
                <span style={{ fontWeight: 600 }}>{formatTime(time_taken_sec)}</span>
              </div>
              <ProgressBar value={time_taken_sec} max={duration_allowed_sec} color="#6366f1" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>
              Avg {Math.round(time_taken_sec / total_questions)}s per question · {formatTime(duration_allowed_sec - time_taken_sec)} remaining
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab: Subjects ── */}
      {activeTab === 'subjects' && (
        <div>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Subject-wise Accuracy</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#7c8499', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="subject" tick={{ fill: '#e8eaf0', fontSize: 11 }} width={70} />
                <Tooltip
                  contentStyle={{ background: '#171d2e', border: '1px solid #1e2638', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [`${v}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {Object.entries(subject_analysis || {}).map(([subj, d]) => (
              <Card key={subj} style={{ borderLeft: `3px solid ${accuracyColor(d.accuracy)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{subj}</span>
                  <span style={{ fontWeight: 700, color: accuracyColor(d.accuracy) }}>{d.accuracy}%</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 8 }}>
                  <span style={{ color: '#10b981' }}>✓ {d.correct}</span>
                  <span style={{ color: '#ef4444' }}>✗ {d.incorrect}</span>
                  <span>○ {d.unattempted}</span>
                  <span>Score: {d.score}</span>
                </div>
                <ProgressBar value={d.accuracy} color={accuracyColor(d.accuracy)} height={4} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Topics ── */}
      {activeTab === 'topics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(topic_analysis || {})
            .sort((a, b) => a[1].accuracy - b[1].accuracy)
            .map(([key, d]) => (
              <Card key={key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.topic}</div>
                  <div style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>{d.subject}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', flexShrink: 0 }}>
                  {d.correct}/{d.attempted} attempted
                </div>
                <div style={{ width: 120 }}>
                  <ProgressBar value={d.accuracy} color={accuracyColor(d.accuracy)} height={6} />
                </div>
                <div style={{ fontWeight: 700, color: accuracyColor(d.accuracy), width: 40, textAlign: 'right', flexShrink: 0 }}>
                  {d.accuracy}%
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* ── Tab: Review Questions ── */}
      {activeTab === 'questions' && (
        <div>
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[
              { key: 'all',         label: `All (${responses?.length})` },
              { key: 'correct',     label: `Correct (${correct_count})` },
              { key: 'incorrect',   label: `Incorrect (${incorrect_count})` },
              { key: 'unattempted', label: `Skipped (${unattempted_count})` },
            ].map(({ key, label }) => (
              <button
                key={key} onClick={() => setRF(key)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${reviewFilter === key ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  background: reviewFilter === key ? 'var(--clr-primary)' : 'transparent',
                  color: reviewFilter === key ? '#fff' : 'var(--clr-text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredResponses.map((r, i) => (
              <QuestionReviewCard key={r.question_id} r={r} idx={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Focus Plan ── */}
      {activeTab === 'focus' && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--clr-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Based on your accuracy and exam weightage, here's your personalised study plan:
          </p>
          {focus_suggestions?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {focus_suggestions.map((f, i) => {
                const ps = priorityStyle(f.priority);
                return (
                  <Card key={i} style={{ borderLeft: `3px solid ${ps.text}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.text }}>
                        {ps.label}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{f.subject}{f.topic ? ` › ${f.topic}` : ''}</div>
                      <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>{f.reason}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '20px 0' }}>
                Great performance! No critical focus areas identified.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Single Question Review Card ──────────────────────────────────── */
function QuestionReviewCard({ r, idx }) {
  const [open, setOpen] = useState(false);
  const statusColor = r.is_correct ? '#10b981' : r.is_attempted ? '#ef4444' : '#7c8499';
  const statusLabel = r.is_correct ? '✓ Correct' : r.is_attempted ? '✗ Incorrect' : '○ Skipped';

  return (
    <Card style={{ borderLeft: `3px solid ${statusColor}` }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
      >
        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: statusColor, minWidth: 80 }}>
          {statusLabel}
        </span>
        <div style={{ flex: 1, fontSize: 14, lineHeight: 1.6 }}>
          {r.question_text?.length > 120 ? r.question_text.slice(0, 120) + '…' : r.question_text}
        </div>
        <span style={{ color: 'var(--clr-text-muted)', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {/* Full question */}
          <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 14, color: 'var(--clr-text)' }}>{r.question_text}</p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {r.options && Object.entries(r.options).map(([letter, text]) => {
              const isCorrect  = letter === r.correct_answer;
              const isSelected = letter === r.selected_answer;
              let bg = 'var(--clr-surface2)';
              let border = 'var(--clr-border)';
              let color  = 'var(--clr-text-muted)';
              if (isCorrect)  { bg = 'rgba(16,185,129,0.1)'; border = '#10b981'; color = '#10b981'; }
              if (isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#ef4444'; }
              return (
                <div key={letter} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: bg, border: `1px solid ${border}` }}>
                  <span style={{ fontWeight: 700, color, flexShrink: 0 }}>{letter}.</span>
                  <span style={{ fontSize: 13, color }}>{text}</span>
                  {isCorrect   && <span style={{ marginLeft: 'auto', flexShrink: 0, color: '#10b981', fontSize: 12 }}>✓ Correct answer</span>}
                  {isSelected && !isCorrect && <span style={{ marginLeft: 'auto', flexShrink: 0, color: '#ef4444', fontSize: 12 }}>✗ Your answer</span>}
                </div>
              );
            })}
          </div>

          {/* Student's reason */}
          {r.student_reason && (
            <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--clr-primary)', fontWeight: 700, marginBottom: 4 }}>YOUR REASONING</div>
              <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>{r.student_reason}</p>
            </div>
          )}

          {/* Explanation */}
          <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 4 }}>EXPLANATION</div>
            <p style={{ fontSize: 13, color: 'var(--clr-text)', lineHeight: 1.7 }}>{r.explanation}</p>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--clr-text-muted)', background: 'var(--clr-surface2)', padding: '2px 8px', borderRadius: 99 }}>
              {r.subject}
            </span>
            {r.topic && <span style={{ fontSize: 11, color: 'var(--clr-text-muted)', background: 'var(--clr-surface2)', padding: '2px 8px', borderRadius: 99 }}>{r.topic}</span>}
            <span style={{ fontSize: 11, color: difficultyColor(r.difficulty).text, background: difficultyColor(r.difficulty).bg, padding: '2px 8px', borderRadius: 99 }}>
              {r.difficulty}
            </span>
            <span style={{ fontSize: 11, color: statusColor, fontWeight: 700, marginLeft: 'auto' }}>
              {r.marks_awarded > 0 ? `+${r.marks_awarded}` : r.marks_awarded} marks
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
