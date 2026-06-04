import { useEffect, useRef, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal.jsx';
import { useNavigate } from 'react-router-dom';
import useTestStore from '../store/testStore';
import { Btn, Spinner } from '../components/ui/index.jsx';
import { formatTime, difficultyColor } from '../utils/helpers';

export default function ActiveTestPage() {
  const [showFeedback, setShowFeedback]     = useState(false);
  const [confirmSubmit, setConfirmSubmit]   = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const {
    questions, responses, currentIndex, timeRemainingS, sessionMeta, status,
    selectAnswer, saveReason, toggleReview, goTo, goNext, goPrev, tickTimer, submitTest,
  } = useTestStore();

  const navigate      = useNavigate();
  const timerRef      = useRef(null);
  const startTimeRef  = useRef(Date.now());

  useEffect(() => {
    if (status === 'idle') navigate('/tests');
  }, [status]);

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
    setConfirmSubmit(false);
    setSubmitting(true);
    const taken  = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const result = await submitTest(taken);
    setSubmitting(false);
    if (result?.success) {
      setShowFeedback(true);
    } else {
      navigate(`/analysis/${useTestStore.getState().sessionId}`);
    }
  };

  if (status === 'loading' || !questions.length) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size={36} />
    </div>
  );

  const q            = questions[currentIndex];
  const resp         = responses[q?.question_id] || {};
  const totalQ       = questions.length;
  const answered     = Object.values(responses).filter((r) => r.selected_answer !== null).length;
  const markedReview = Object.values(responses).filter((r) => r.marked_review).length;
  const diffStyle    = difficultyColor(q?.difficulty);

  const timerPct   = sessionMeta?.duration_allowed_sec
    ? (timeRemainingS / sessionMeta.duration_allowed_sec) * 100 : 100;
  const timerColor = timerPct > 25 ? '#16a34a' : timerPct > 10 ? '#d97706' : '#dc2626';
  const timerBg    = timerPct > 25 ? '#f0fdf4' : timerPct > 10 ? '#fffbeb' : '#fef2f2';
  const timerBorder= timerPct > 25 ? '#86efac' : timerPct > 10 ? '#fcd34d' : '#fca5a5';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--clr-bg)',
      fontFamily: 'var(--font-sans)',
    }}>

      {/* ── Left: Question area ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 20px',
          height: 52,
          borderBottom: '1px solid var(--clr-border)',
          background: 'var(--clr-surface)',
          flexShrink: 0,
        }}>
          {/* Title + progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--clr-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {sessionMeta?.paper_title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 1 }}>
              Q {currentIndex + 1} of {totalQ} · {answered} answered
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: 120, height: 4, background: 'var(--clr-border)', borderRadius: 99, flexShrink: 0 }}>
            <div style={{
              height: '100%',
              borderRadius: 99,
              background: '#6366f1',
              width: `${Math.round((answered / totalQ) * 100)}%`,
              transition: 'width 0.3s',
            }} />
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 8,
            background: timerBg,
            border: `1px solid ${timerBorder}`,
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: 700,
              color: timerColor,
              letterSpacing: '0.05em',
            }}>
              {formatTime(timeRemainingS)}
            </span>
          </div>

          {/* Submit button */}
          <button
            onClick={() => setConfirmSubmit(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
          >
            Submit test
          </button>
        </div>

        {/* ── Question body ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 32px' }}>

          {/* Q number + tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--clr-text-muted)',
              background: 'var(--clr-surface2)',
              padding: '2px 8px',
              borderRadius: 6,
            }}>
              Q{currentIndex + 1}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 9px',
              borderRadius: 99,
              background: diffStyle.bg,
              color: diffStyle.text,
            }}>
              {q?.difficulty}
            </span>
            {q?.subject && (
              <span style={{
                fontSize: 11,
                color: 'var(--clr-text-muted)',
                background: 'var(--clr-surface2)',
                padding: '2px 9px',
                borderRadius: 99,
                border: '1px solid var(--clr-border)',
              }}>
                {q.subject}
              </span>
            )}
            {q?.topic && (
              <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>
                · {q.topic}
              </span>
            )}
          </div>

          {/* Question text */}
          <p style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: 'var(--clr-text)',
            fontWeight: 400,
            marginBottom: 24,
            maxWidth: 780,
          }}>
            {q?.question_text}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, maxWidth: 780 }}>
            {q && Object.entries(q.options).map(([letter, text]) => {
              const chosen = resp.selected_answer === letter;
              return (
                <button
                  key={letter}
                  onClick={() => selectAnswer(q.question_id, letter)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.12s',
                    background: chosen ? 'rgba(99,102,241,0.08)' : 'var(--clr-surface)',
                    border: `1px solid ${chosen ? '#6366f1' : 'var(--clr-border)'}`,
                    color: 'var(--clr-text)',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!chosen) e.currentTarget.style.borderColor = 'var(--clr-text-muted)';
                  }}
                  onMouseLeave={(e) => {
                    if (!chosen) e.currentTarget.style.borderColor = 'var(--clr-border)';
                  }}
                >
                  {/* Letter circle */}
                  <span style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    background: chosen ? '#6366f1' : 'var(--clr-surface2)',
                    color: chosen ? '#fff' : 'var(--clr-text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.12s',
                  }}>
                    {letter}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.65, paddingTop: 3, color: chosen ? 'var(--clr-text)' : 'var(--clr-text)' }}>
                    {text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reason textarea */}
          <div style={{ maxWidth: 780, marginBottom: 28 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <label style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--clr-text-muted)',
              }}>
                Why did you choose this answer?{' '}
                <span style={{ fontWeight: 400, opacity: 0.7 }}>optional — helps track real knowledge</span>
              </label>
            </div>
            <textarea
              value={resp.student_reason || ''}
              onChange={(e) => saveReason(q.question_id, e.target.value)}
              placeholder="e.g. Beta-blockers are first-line unless haemodynamically unstable..."
              rows={2}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--clr-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 8,
                color: 'var(--clr-text)',
                fontSize: 13,
                resize: 'vertical',
                lineHeight: 1.6,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
            />
          </div>

          {/* Bottom nav row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 780 }}>

            {/* Mark for review */}
            <button
              onClick={() => toggleReview(q.question_id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                background: resp.marked_review ? '#fffbeb' : 'var(--clr-surface)',
                border: `1px solid ${resp.marked_review ? '#fcd34d' : 'var(--clr-border)'}`,
                color: resp.marked_review ? '#92400e' : 'var(--clr-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={resp.marked_review ? '#f59e0b' : 'none'} stroke={resp.marked_review ? '#f59e0b' : 'var(--clr-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {resp.marked_review ? 'Marked for review' : 'Mark for review'}
            </button>

            <div style={{ flex: 1 }} />

            {/* Prev */}
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: 'var(--clr-surface)',
                border: '1px solid var(--clr-border)',
                color: currentIndex === 0 ? 'var(--clr-text-muted)' : 'var(--clr-text)',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.45 : 1,
                transition: 'all 0.12s',
              }}
            >
              ← Prev
            </button>

            {/* Next / Finish */}
            <button
              onClick={currentIndex === totalQ - 1 ? () => setConfirmSubmit(true) : goNext}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: currentIndex === totalQ - 1 ? '#16a34a' : '#6366f1',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                transition: 'opacity 0.12s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {currentIndex === totalQ - 1 ? 'Finish test' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Question palette ───────────────────────────────────── */}
      <div style={{
        width: 220,
        flexShrink: 0,
        borderLeft: '1px solid var(--clr-border)',
        background: 'var(--clr-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Palette header */}
        <div style={{
          padding: '0 16px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--clr-border)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--clr-text)',
          flexShrink: 0,
        }}>
          Question palette
        </div>

        {/* Legend */}
        <div style={{
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          borderBottom: '1px solid var(--clr-border)',
          flexShrink: 0,
        }}>
          {[
            { bg: '#6366f1', label: 'Answered', count: answered },
            { bg: 'var(--clr-surface2)', label: 'Not attempted', count: totalQ - answered - markedReview },
            { bg: '#f59e0b', label: 'Marked for review', count: markedReview },
          ].map(({ bg, label, count }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: bg,
                flexShrink: 0,
                border: bg === 'var(--clr-surface2)' ? '1px solid var(--clr-border)' : 'none',
              }} />
              <span style={{ fontSize: 11, color: 'var(--clr-text-muted)', flex: 1 }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--clr-text-muted)' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
            {questions.map((qq, idx) => {
              const r          = responses[qq.question_id] || {};
              const isAnswered = r.selected_answer !== null;
              const isCurrent  = idx === currentIndex;
              const isReview   = r.marked_review;

              let bg     = 'var(--clr-surface2)';
              let color  = 'var(--clr-text-muted)';
              let border = '1px solid var(--clr-border)';

              if (isReview)   { bg = '#fffbeb'; color = '#92400e'; border = '1px solid #fcd34d'; }
              else if (isAnswered) { bg = '#6366f1'; color = '#fff'; border = '1px solid #4f46e5'; }

              return (
                <button
                  key={qq.question_id}
                  onClick={() => goTo(idx)}
                  title={`Q${idx + 1}${isAnswered ? ' · Answered' : ''}${isReview ? ' · Marked' : ''}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 5,
                    background: bg,
                    border: isCurrent ? '2px solid #6366f1' : border,
                    color,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    outline: 'none',
                    boxShadow: isCurrent ? '0 0 0 2px rgba(99,102,241,0.25)' : 'none',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats footer */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--clr-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          flexShrink: 0,
        }}>
          {[
            { label: 'Answered',     value: answered,               color: '#6366f1' },
            { label: 'Not attempted',value: totalQ - answered,      color: 'var(--clr-text-muted)' },
            { label: 'Marked',       value: markedReview,           color: '#d97706' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confirm submit modal ──────────────────────────────────────── */}
      {confirmSubmit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 12,
            padding: '28px 28px 24px',
            width: 360,
            maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 10 }}>
              Submit test?
            </div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.65, marginBottom: 6 }}>
              You have answered{' '}
              <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>{answered}</span>
              {' '}of{' '}
              <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>{totalQ}</span>
              {' '}questions.
            </p>
            {totalQ - answered > 0 && (
              <p style={{
                fontSize: 12,
                color: '#92400e',
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: 6,
                padding: '7px 10px',
                marginBottom: 20,
                lineHeight: 1.5,
              }}>
                {totalQ - answered} unanswered {totalQ - answered === 1 ? 'question' : 'questions'} will score 0.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setConfirmSubmit(false)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  background: 'var(--clr-surface)',
                  border: '1px solid var(--clr-border)',
                  color: 'var(--clr-text)',
                  cursor: 'pointer',
                }}
              >
                Continue test
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  background: submitting ? '#fca5a5' : '#dc2626',
                  border: 'none',
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
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