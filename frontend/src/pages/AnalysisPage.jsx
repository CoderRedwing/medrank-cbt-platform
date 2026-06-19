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
      .then((r) => {
        console.log("BACKEND DATA RECEIVED:", r.data.data.responses);
        setData(r.data.data)})
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
      // REPLACE WITH:
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{paper_title}</h1>
          <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', marginTop: 4 }}>
            {new Date(submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            {time_taken_sec > 0 && ` · Time taken: ${formatTime(time_taken_sec)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            variant="secondary"
            onClick={() => navigate(`/air-predictor?score=${score.raw}&max=${score.max}`)}
          >
            🎯 Predict AIR
          </Btn>
          <Btn variant="secondary" onClick={() => navigate('/tests')}>New Test</Btn>
        </div>
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

  const finalQuestionText = r.question_text || r.question || "Question text not available";

  // ── Status config ────────────────────────────────────────────────────────
  const status = r.is_correct ? 'correct' : r.is_attempted ? 'incorrect' : 'skipped';
  const statusCfg = {
    correct:   { label: 'Correct',   icon: '✓', bg: '#f0fdf4', border: '#86efac', color: '#166534', leftBar: '#22c55e' },
    incorrect: { label: 'Incorrect', icon: '✗', bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', leftBar: '#ef4444' },
    skipped:   { label: 'Skipped',   icon: '○', bg: 'var(--clr-surface)',  border: 'var(--clr-border)', color: 'var(--clr-text-muted)', leftBar: '#94a3b8' },
  }[status];

  // ── Difficulty config ────────────────────────────────────────────────────
  const diffCfg = {
    Easy:      { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
    Moderate:  { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
    Hard:      { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
    'Very Hard':{ bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  };
  const diff = diffCfg[r.difficulty] || diffCfg['Moderate'];

  // ── Option renderer (handles both Array and Object shapes) ───────────────
  const renderOptions = () => {
    let entries = [];
    if (Array.isArray(r.options)) {
      entries = r.options.map((text, i) => [String.fromCharCode(65 + i), text]);
    } else if (r.options && typeof r.options === 'object') {
      entries = Object.entries(r.options);
    }

    if (entries.length === 0) return null;

    return entries.map(([letter, text]) => {
      const isCorrect  = letter === r.correct_answer;
      const isSelected = letter === r.selected_answer;
      const isWrong    = isSelected && !isCorrect;

      const optStyle = {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${isCorrect ? '#86efac' : isWrong ? '#fca5a5' : 'var(--clr-border)'}`,
        background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : 'var(--clr-surface2)',
        transition: 'background 0.15s',
      };

      const letterColor = isCorrect ? '#166534' : isWrong ? '#991b1b' : 'var(--clr-text-muted)';
      const textColor   = isCorrect ? '#166534' : isWrong ? '#991b1b' : 'var(--clr-text)';

      return (
        <div key={letter} style={optStyle}>
          {/* Letter bubble */}
          <span style={{
            flexShrink: 0,
            width: 22, height: 22,
            borderRadius: '50%',
            background: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--clr-surface3)',
            color: isCorrect || isWrong ? '#fff' : 'var(--clr-text-muted)',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {letter}
          </span>

          {/* Option text */}
          <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: textColor }}>
            {text}
          </span>

          {/* Right tag */}
          {isCorrect && (
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 600,
              color: '#166534', background: '#dcfce7',
              padding: '2px 8px', borderRadius: 99, marginTop: 1,
            }}>
              ✓ Correct
            </span>
          )}
          {isWrong && (
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 600,
              color: '#991b1b', background: '#fee2e2',
              padding: '2px 8px', borderRadius: 99, marginTop: 1,
            }}>
              ✗ Your answer
            </span>
          )}
        </div>
      );
    });
  };

  // ── Marks display ────────────────────────────────────────────────────────
  const marksColor = r.marks_awarded > 0 ? '#166534' : r.marks_awarded < 0 ? '#991b1b' : 'var(--clr-text-muted)';
  const marksLabel = r.marks_awarded > 0 ? `+${r.marks_awarded}` : `${r.marks_awarded}`;

  return (
    <div style={{
      background: 'var(--clr-surface)',
      border: '1px solid var(--clr-border)',
      borderLeft: `3px solid ${statusCfg.leftBar}`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 6,
    }}>

      {/* ── Header (always visible) ── */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 16px', cursor: 'pointer',
        }}
      >
        {/* Status badge */}
        <span style={{
          flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 99,
          background: statusCfg.bg,
          color: statusCfg.color,
          border: `1px solid ${statusCfg.border}`,
          marginTop: 1,
        }}>
          {statusCfg.icon} {statusCfg.label}
        </span>

        {/* Question preview */}
        <p style={{
          flex: 1, fontSize: 14, lineHeight: 1.55,
          color: 'var(--clr-text)', margin: 0,
        }}>
          {finalQuestionText.length > 110
            ? finalQuestionText.slice(0, 110) + '…'
            : finalQuestionText}
        </p>

        {/* Marks + chevron */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: marksColor }}>
            {marksLabel} marks
          </span>
          <span style={{
            fontSize: 11, color: 'var(--clr-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>▼</span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: '1px solid var(--clr-border)', padding: '16px 16px 14px' }}>

          {/* Full question */}
          <p style={{
            fontSize: 14, lineHeight: 1.75,
            color: 'var(--clr-text)', marginBottom: 14,
            fontWeight: 500,
          }}>
            {finalQuestionText}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {renderOptions()}
          </div>

          {/* Student reasoning */}
          {r.student_reason && (
            <div style={{
              marginBottom: 10, padding: '10px 14px',
              background: 'rgba(99,102,241,0.07)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--clr-primary)', marginBottom: 4 }}>
                YOUR REASONING
              </div>
              <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', lineHeight: 1.6, margin: 0 }}>
                {r.student_reason}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div style={{
            padding: '10px 14px', marginBottom: 14,
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: '#166534', marginBottom: 5 }}>
              EXPLANATION
            </div>
            <p style={{ fontSize: 13, color: '#14532d', lineHeight: 1.75, margin: 0 }}>
              {r.explanation || "No explanation available."}
            </p>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 99,
              background: 'var(--clr-surface2)', color: 'var(--clr-text-muted)',
              border: '1px solid var(--clr-border)',
            }}>
              {r.subject}
            </span>
            {r.topic && (
              <span style={{
                fontSize: 11, padding: '2px 9px', borderRadius: 99,
                background: 'var(--clr-surface2)', color: 'var(--clr-text-muted)',
                border: '1px solid var(--clr-border)',
              }}>
                {r.topic}
              </span>
            )}
            {r.subtopic && (
              <span style={{
                fontSize: 11, padding: '2px 9px', borderRadius: 99,
                background: 'var(--clr-surface2)', color: 'var(--clr-text-muted)',
                border: '1px solid var(--clr-border)',
              }}>
                {r.subtopic}
              </span>
            )}
            <span style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 99,
              background: diff.bg, color: diff.color,
              border: `1px solid ${diff.border}`,
            }}>
              {r.difficulty || 'Moderate'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}