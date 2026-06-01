import { useEffect, useRef, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal.jsx';
import { useNavigate } from 'react-router-dom';
import useTestStore from '../store/testStore';
import { Btn, Spinner } from '../components/ui/index.jsx';
import { formatTime, difficultyColor } from '../utils/helpers';

export default function ActiveTestPage() {
  const [showFeedback, setShowFeedback] = useState(false);
  const {
    questions, responses, currentIndex, timeRemainingS, sessionMeta, status,
    selectAnswer, saveReason, toggleReview, goTo, goNext, goPrev, tickTimer, submitTest,
  } = useTestStore();
  const navigate     = useNavigate();
  const timerRef     = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [panelOpen, setPanelOpen]         = useState(false);

  // Redirect if no active session
  useEffect(() => {
    if (status === 'idle') navigate('/tests');
  }, [status]);

  // Timer tick
  useEffect(() => {
    timerRef.current = setInterval(() => {
      tickTimer();
      if (useTestStore.getState().timeRemainingS <= 0) {
        clearInterval(timerRef.current);
        handleSubmit(true);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = async (timedOut = false) => {
  clearInterval(timerRef.current);
  setConfirmSubmit(false); // ← close confirm modal first
  setSubmitting(true);
  const taken = Math.floor((Date.now() - startTimeRef.current) / 1000);
  const result = await submitTest(taken);
  setSubmitting(false);
  if (result?.success) {
    setShowFeedback(true);
  } else {
    navigate(`/analysis/${useTestStore.getState().sessionId}`);
  }
};

  if (status === 'loading' || !questions.length) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div>
  );

  const q           = questions[currentIndex];
  const resp        = responses[q?.question_id] || {};
  const totalQ      = questions.length;
  const answered    = Object.values(responses).filter((r) => r.selected_answer !== null).length;
  const markedReview = Object.values(responses).filter((r) => r.marked_review).length;
  const diffStyle   = difficultyColor(q?.difficulty);
  const timerPct    = sessionMeta?.duration_allowed_sec
    ? (timeRemainingS / sessionMeta.duration_allowed_sec) * 100 : 100;
  const timerColor  = timerPct > 25 ? '#10b981' : timerPct > 10 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--clr-bg)' }}>

      {/* ── Left: Question area ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 20px', borderBottom: '1px solid var(--clr-border)',
          background: 'var(--clr-surface)', flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sessionMeta?.paper_title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>
              Q {currentIndex + 1} of {totalQ} · {answered} answered
            </div>
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 8,
            background: `${timerColor}15`, border: `1px solid ${timerColor}40`,
          }}>
            <span style={{ fontSize: 11, color: timerColor }}>⏱</span>
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: timerColor }}>
              {formatTime(timeRemainingS)}
            </span>
          </div>

          <Btn variant="danger" size="sm" onClick={() => setConfirmSubmit(true)}>
            Submit Test
          </Btn>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: 'var(--clr-primary)', fontSize: 20, cursor: 'pointer' }}
          >
            ☰
          </button>
        </div>

        {/* Question */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

          {/* Q header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-text-muted)' }}>
              Q{currentIndex + 1}.
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: diffStyle.bg, color: diffStyle.text,
            }}>
              {q?.difficulty}
            </span>
            {q?.subject && (
              <span style={{ fontSize: 11, color: 'var(--clr-text-muted)', background: 'var(--clr-surface2)', padding: '2px 8px', borderRadius: 99 }}>
                {q.subject}
              </span>
            )}
            {q?.topic && (
              <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>· {q.topic}</span>
            )}
          </div>

          {/* Question text */}
          <div style={{
            fontSize: 16, lineHeight: 1.7, marginBottom: 28,
            fontWeight: 400, color: 'var(--clr-text)',
          }}>
            {q?.question_text}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {q && Object.entries(q.options).map(([letter, text]) => {
              const chosen = resp.selected_answer === letter;
              return (
                <button
                  key={letter}
                  onClick={() => selectAnswer(q.question_id, letter)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 18px', borderRadius: 10, textAlign: 'left',
                    cursor: 'pointer', width: '100%', transition: 'all 0.15s',
                    background: chosen ? 'rgba(99,102,241,0.15)' : 'var(--clr-surface)',
                    border: `1.5px solid ${chosen ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    color: 'var(--clr-text)',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: chosen ? 'var(--clr-primary)' : 'var(--clr-surface2)',
                    color: chosen ? '#fff' : 'var(--clr-text-muted)',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {letter}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{text}</span>
                </button>
              );
            })}
          </div>

          {/* Reason textarea */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--clr-text-muted)' }}>
              💬 Why did you choose this answer? <span style={{ fontWeight: 400 }}>(optional but helps track real knowledge)</span>
            </label>
            <textarea
              value={resp.student_reason || ''}
              onChange={(e) => saveReason(q.question_id, e.target.value)}
              placeholder="e.g. Atrial fibrillation requires rate control with beta-blockers first unless haemodynamically unstable..."
              rows={3}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                borderRadius: 8, color: 'var(--clr-text)', fontSize: 13,
                resize: 'vertical', lineHeight: 1.6, outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--clr-primary)'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
            />
          </div>

          {/* Mark for review + navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => toggleReview(q.question_id)}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13,
                background: resp.marked_review ? 'rgba(245,158,11,0.15)' : 'var(--clr-surface)',
                border: `1px solid ${resp.marked_review ? '#f59e0b' : 'var(--clr-border)'}`,
                color: resp.marked_review ? '#f59e0b' : 'var(--clr-text-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {resp.marked_review ? '★ Marked' : '☆ Mark for review'}
            </button>

            <div style={{ flex: 1 }} />

            <Btn variant="secondary" onClick={goPrev} disabled={currentIndex === 0}>← Prev</Btn>
            <Btn variant={currentIndex === totalQ - 1 ? 'primary' : 'secondary'} onClick={currentIndex === totalQ - 1 ? () => setConfirmSubmit(true) : goNext}>
              {currentIndex === totalQ - 1 ? 'Finish' : 'Next →'}
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Right: Question palette ─────────────────────────────────── */}
      <div style={{
        width: 240, flexShrink: 0,
        borderLeft: '1px solid var(--clr-border)',
        background: 'var(--clr-surface)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--clr-border)', fontSize: 13, fontWeight: 700 }}>
          Question Palette
        </div>

        {/* Legend */}
        <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--clr-border)' }}>
          {[
            { color: '#6366f1', label: 'Answered' },
            { color: 'var(--clr-surface2)', label: 'Not attempted' },
            { color: '#f59e0b', label: 'Marked' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--clr-text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} />
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {questions.map((qq, idx) => {
              const r = responses[qq.question_id] || {};
              const isAnswered = r.selected_answer !== null;
              const isCurrent  = idx === currentIndex;
              const isReview   = r.marked_review;
              let bg = 'var(--clr-surface2)';
              if (isReview)   bg = 'rgba(245,158,11,0.3)';
              else if (isAnswered) bg = 'rgba(99,102,241,0.4)';
              return (
                <button
                  key={qq.question_id}
                  onClick={() => goTo(idx)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 6,
                    background: bg, border: `2px solid ${isCurrent ? 'var(--clr-primary)' : 'transparent'}`,
                    color: isAnswered ? '#fff' : 'var(--clr-text-muted)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--clr-border)', fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-muted)', marginBottom: 4 }}>
            <span>Answered</span><span style={{ color: '#6366f1', fontWeight: 700 }}>{answered}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-muted)', marginBottom: 4 }}>
            <span>Not attempted</span><span>{totalQ - answered}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-muted)' }}>
            <span>Marked review</span><span style={{ color: '#f59e0b', fontWeight: 700 }}>{markedReview}</span>
          </div>
        </div>
      </div>

      {/* ── Confirm submit modal ────────────────────────────────────── */}
      {confirmSubmit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 16, padding: 32, maxWidth: 380, width: '90%',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
              Submit Test?
            </h2>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              You've answered <strong style={{ color: '#fff' }}>{answered}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{totalQ}</strong> questions.
              {totalQ - answered > 0 && ` ${totalQ - answered} unanswered will score 0.`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" onClick={() => setConfirmSubmit(false)} style={{ flex: 1 }}>
                Continue Test
              </Btn>
              <Btn variant="danger" loading={submitting} onClick={() => handleSubmit()} style={{ flex: 1 }}>
                Submit
              </Btn>
            </div>
          </div>
        </div>
      )}
      {showFeedback && (
      <FeedbackModal onClose={() => {
      setShowFeedback(false);
      navigate(`/analysis/${useTestStore.getState().sessionId}`);
      }} />
     )}
    </div>
  );
}
