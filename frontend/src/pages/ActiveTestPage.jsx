import { useEffect, useRef, useState } from 'react';
import FeedbackModal from '../components/FeedbackModal.jsx';
import { useNavigate } from 'react-router-dom';
import useTestStore from '../store/testStore';
import { Spinner } from '../components/ui/index.jsx';
import { formatTime, difficultyColor } from '../utils/helpers';
import useProctoring from '../hooks/useProctoring';
import MathText from '../components/MathText';
import useAuthStore from '../store/authStore';

export default function ActiveTestPage() {
  const [showFeedback,   setShowFeedback]   = useState(false);
  const [confirmSubmit,  setConfirmSubmit]  = useState(false);
  const [confirmSection, setConfirmSection] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);

  const {
    questions, responses, currentIndex, sessionMeta, status,
    sections, currentSectionIndex, showSectionTransition, sectionAutoAdvanced,
    selectAnswer, saveReason, toggleReview, goTo, goNext, goPrev,
    tickSectionTimer, submitSection, dismissSectionTransition, submitTest,
  } = useTestStore();

  const navigate     = useNavigate();
  const timerRef     = useRef(null);
  const startTimeRef = useRef(Date.now());

  /* ── Final submit ────────────────────────────────────────────── */
  const handleFinalSubmit = async () => {
  clearInterval(timerRef.current);
  setConfirmSubmit(false);
  setSubmitting(true);
  const taken = Math.floor((Date.now() - startTimeRef.current) / 1000);
  const result = await submitTest(taken);
  setSubmitting(false);
  if (result?.success) {
    const sessionId = useTestStore.getState().sessionId;
    const user = useAuthStore.getState().user;  // ← add this import
    if (user?.feedback?.rating) {
      // Already gave feedback before — go straight to analysis
      navigate(`/analysis/${sessionId}`);
    } else {
      setShowFeedback(true);
    }
  } else {
    navigate(`/analysis/${useTestStore.getState().sessionId}`);
  }
};

  /* ── Proctoring ──────────────────────────────────────────────── */
  const {
    warningCount, showWarning, showExitConfirm,
    triggerViolation, confirmLeave, dismissConfirm,
  } = useProctoring({
    enabled:      status === 'active',
    onAutoSubmit: handleFinalSubmit,
  });

  /* ── Redirect if no active test ──────────────────────────────── */
  useEffect(() => {
    if (status === 'idle') navigate('/tests');
  }, [status]);

  /* ── Show feedback when submitted ────────────────────────────── */
  useEffect(() => {
    if (status === 'submitted') setShowFeedback(true);
  }, [status]);

  /* ── Section timer ───────────────────────────────────────────── */
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => tickSectionTimer(), 1000);
    return () => clearInterval(timerRef.current);
  }, [currentSectionIndex]);

  /* ── Intercept browser back button ───────────────────────────── */
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
      triggerViolation();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [triggerViolation]);

  /* ── Loading guard ───────────────────────────────────────────── */
  // REPLACE WITH (adds submitting screen right after):
  if (status === 'loading' || !questions.length || !sections.length) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size={36} />
    </div>
  );

  if (submitting) return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      height: '100vh', gap: 16,
      background: 'var(--clr-bg)',
    }}>
      <Spinner size={36} />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-text)' }}>
        Submitting your test…
      </div>
      <div style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>
        Please don't close this tab
      </div>
    </div>
  );

  /* ── Derived values ──────────────────────────────────────────── */
  const isMultiSection = sections.length > 1; // true only for full papers

  const currentSection = sections[currentSectionIndex];

  const sectionStart = (() => {
    let s = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      s += sections[i]?.questionIds?.length ?? 0;
    }
    return s;
  })();

  const qPerSec          = currentSection?.questionIds?.length ?? questions.length;
  const sectionQuestions = questions.slice(sectionStart, sectionStart + qPerSec);
  const localIndex       = currentIndex - sectionStart;
  const q                = questions[currentIndex];
  const resp             = responses[q?.question_id] || {};
  const totalQ           = questions.length;
  const isLastSection    = currentSectionIndex === sections.length - 1;
  const isLastQInSection = localIndex === qPerSec - 1;

  const sectionAnswered   = sectionQuestions.filter((qq) => responses[qq.question_id]?.selected_answer !== null).length;
  const sectionMarked     = sectionQuestions.filter((qq) => responses[qq.question_id]?.marked_review).length;
  const sectionUnanswered = sectionQuestions.length - sectionAnswered;
  const totalAnswered     = Object.values(responses).filter((r) => r.selected_answer !== null).length;

  const diffStyle      = difficultyColor(q?.difficulty);
  const timeRemainingS = currentSection?.timeRemainingS ?? 0;
  const sectionMaxS    = currentSection?.initialDurationS ?? (42 * 60);
  const timerPct       = (timeRemainingS / sectionMaxS) * 100;
  const timerColor     = timerPct > 25 ? '#16a34a' : timerPct > 10 ? '#d97706' : '#dc2626';
  const timerBg        = timerPct > 25 ? '#f0fdf4' : timerPct > 10 ? '#fffbeb' : '#fef2f2';
  const timerBorder    = timerPct > 25 ? '#86efac' : timerPct > 10 ? '#fcd34d' : '#fca5a5';
  const sectionMins    = Math.round((currentSection?.timeRemainingS ?? sectionMaxS) / 60);

  // ─── Image-based question detection ──────────────────────────────────
  const isImageBased = !!(q?.is_image_based || q?.image_based);

  /* ── Section submit ──────────────────────────────────────────── */
  const handleSectionSubmit = () => {
    setConfirmSection(false);
    submitSection();
  };

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--clr-bg)', fontFamily: 'var(--font-sans)',
    }}>

      {/* ══════════════════════════════════════════════════════════
          LEFT — Question area
      ══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Top bar ────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 20px', height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--clr-border)',
          background: 'var(--clr-surface)',
        }}>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--clr-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {sessionMeta?.paper_title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 1 }}>
              Q{currentIndex + 1} of {totalQ} · {totalAnswered} answered overall
            </div>
          </div>

          {/* Section progress pills — full papers only */}
          {isMultiSection && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {sections.map((s, i) => {
                const isActive    = i === currentSectionIndex;
                const isSubmitted = s.status === 'submitted';
                const isLocked    = s.status === 'locked';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: 32, height: 6, borderRadius: 99,
                      background: isSubmitted ? '#6366f1' : isActive ? '#a5b4fc' : 'var(--clr-border)',
                      transition: 'background 0.3s',
                    }} />
                    <span style={{
                      fontSize: 9, fontWeight: isActive ? 700 : 400,
                      color: isActive || isSubmitted ? '#6366f1' : 'var(--clr-text-muted)',
                      opacity: isLocked ? 0.4 : 1,
                    }}>
                      S{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section badge — full papers only */}
          {isMultiSection && (
            <div style={{
              padding: '3px 10px', borderRadius: 6, flexShrink: 0,
              background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
              fontSize: 12, fontWeight: 600, color: 'var(--clr-text)',
            }}>
              Section {currentSectionIndex + 1}/{sections.length}
            </div>
          )}

          {/* Timer — always visible */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '5px 12px', borderRadius: 8,
            background: timerBg, border: `1px solid ${timerBorder}`,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={timerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{
              fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
              color: timerColor, letterSpacing: '0.05em',
            }}>
              {formatTime(timeRemainingS)}
            </span>
          </div>

          {/* Submit button — always "Submit Test" for single-section */}
          <button
            onClick={() => {
              if (isMultiSection && !isLastSection) setConfirmSection(true);
              else setConfirmSubmit(true);
            }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
              cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
          >
            {isMultiSection && !isLastSection ? 'Submit Section' : 'Submit Test'}
          </button>
        </div>

        {/* ── Progress bar ───────────────────────────────────────── */}
        <div style={{ height: 3, background: 'var(--clr-border)', flexShrink: 0 }}>
          <div style={{
            height: '100%', background: '#6366f1',
            width: `${totalQ > 0 ? Math.round((totalAnswered / totalQ) * 100) : 0}%`,
            transition: 'width 0.3s',
          }} />
        </div>

        {/* ── Question body (SCROLLABLE) ─────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 20px' }}>

          {/* Q number + tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--clr-text-muted)',
              background: 'var(--clr-surface2)', padding: '2px 8px', borderRadius: 6,
            }}>
              Q{currentIndex + 1}
              {isMultiSection && (
                <span style={{ opacity: 0.5, fontWeight: 400 }}>
                  {' '}(S{currentSectionIndex + 1} · {localIndex + 1}/{qPerSec})
                </span>
              )}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 99,
              background: diffStyle.bg, color: diffStyle.text,
            }}>
              {q?.difficulty}
            </span>
            {q?.subject && (
              <span style={{
                fontSize: 11, color: 'var(--clr-text-muted)', background: 'var(--clr-surface2)',
                padding: '2px 9px', borderRadius: 99, border: '1px solid var(--clr-border)',
              }}>
                {q.subject}
              </span>
            )}
            {q?.topic && (
              <span style={{ fontSize: 11, color: 'var(--clr-text-muted)' }}>· {q.topic}</span>
            )}
            {isImageBased && (
              <span style={{
                fontSize: 11, color: '#185FA5', background: '#E6F1FB',
                padding: '2px 9px', borderRadius: 99, border: '1px solid #B5D4F4',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                🖼️ Image-based
              </span>
            )}
          </div>

          {isImageBased ? (
            /* ════════════════════════════════════════════════════════
               IMAGE-BASED QUESTION LAYOUT (2-column)
            ════════════════════════════════════════════════════════ */
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
              alignItems: 'start', marginBottom: 24, maxWidth: 1080,
            }}>
              {/* Image panel */}
              <div style={{
                background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
                borderRadius: 10, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 12px', borderBottom: '1px solid var(--clr-border)',
                  background: 'var(--clr-surface)', fontSize: 11, fontWeight: 600,
                  color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {q.image_title || 'Clinical Image'}
                </div>
                <div style={{ padding: 12 }}>
                  {q.image_url ? (
                    <img
                      src={q.image_url}
                      alt={q.image_title || 'Clinical image'}
                      style={{
                        width: '100%', borderRadius: 8, marginBottom: 10,
                        border: '1px solid var(--clr-border)', display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      aspectRatio: '4/3', background: 'var(--clr-surface)',
                      border: '1px solid var(--clr-border)', borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10, color: 'var(--clr-text-muted)', fontSize: 12,
                    }}>
                      No image available
                    </div>
                  )}
                  {Array.isArray(q.key_findings) && q.key_findings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {q.key_findings.map((finding, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: '#6366f1', flexShrink: 0, marginTop: 6,
                          }} />
                          <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--clr-text-muted)' }}>
                            {finding}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stem + options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MathText
                  text={q?.question_text}
                  style={{ display: 'block', fontSize: 15, lineHeight: 1.7, color: 'var(--clr-text)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(q.options).map(([letter, text]) => {
                    const chosen = resp.selected_answer === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => selectAnswer(q.question_id, letter)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                          cursor: 'pointer', width: '100%', transition: 'all 0.12s',
                          background: chosen ? 'rgba(99,102,241,0.08)' : 'var(--clr-surface)',
                          border: `1px solid ${chosen ? '#6366f1' : 'var(--clr-border)'}`,
                          color: 'var(--clr-text)', outline: 'none',
                        }}
                        onMouseEnter={(e) => { if (!chosen) e.currentTarget.style.borderColor = 'var(--clr-text-muted)'; }}
                        onMouseLeave={(e) => { if (!chosen) e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
                      >
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          display: 'grid', placeItems: 'center',
                          background: chosen ? '#6366f1' : 'var(--clr-surface2)',
                          color: chosen ? '#fff' : 'var(--clr-text-muted)',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {letter}
                        </span>
                        <MathText text={text} style={{ fontSize: 13, lineHeight: 1.6, paddingTop: 2 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════
               STANDARD QUESTION LAYOUT (unchanged from before)
            ════════════════════════════════════════════════════════ */
            <>
              {/* Question text */}
              <MathText
                text={q?.question_text}
                style={{
                  display: 'block', fontSize: 16, lineHeight: 1.75,
                  color: 'var(--clr-text)', fontWeight: 400,
                  marginBottom: 24, maxWidth: 780,
                }}
              />

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, maxWidth: 780 }}>
                {q && Object.entries(q.options).map(([letter, text]) => {
                  const chosen = resp.selected_answer === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => selectAnswer(q.question_id, letter)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 16px', borderRadius: 8, textAlign: 'left',
                        cursor: 'pointer', width: '100%', transition: 'all 0.12s',
                        background: chosen ? 'rgba(99,102,241,0.08)' : 'var(--clr-surface)',
                        border: `1px solid ${chosen ? '#6366f1' : 'var(--clr-border)'}`,
                        color: 'var(--clr-text)', outline: 'none',
                      }}
                      onMouseEnter={(e) => { if (!chosen) e.currentTarget.style.borderColor = 'var(--clr-text-muted)'; }}
                      onMouseLeave={(e) => { if (!chosen) e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'grid', placeItems: 'center',
                        background: chosen ? '#6366f1' : 'var(--clr-surface2)',
                        color: chosen ? '#fff' : 'var(--clr-text-muted)',
                        fontSize: 12, fontWeight: 600, transition: 'all 0.12s',
                      }}>
                        {letter}
                      </span>
                      <MathText
                        text={text}
                        style={{ fontSize: 14, lineHeight: 1.65, paddingTop: 3, display: 'inline-block' }}
                      />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Reason textarea */}
          <div style={{ maxWidth: 780, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--clr-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-muted)' }}>
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
                width: '100%', padding: '9px 12px',
                background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                borderRadius: 8, color: 'var(--clr-text)', fontSize: 13,
                resize: 'vertical', lineHeight: 1.6, outline: 'none',
                transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
            />
          </div>
        </div>

        {/* ── Fixed bottom nav ──────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid var(--clr-border)',
          background: 'var(--clr-surface)',
          padding: '12px 32px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Mark for review */}
          <button
            onClick={() => toggleReview(q.question_id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: resp.marked_review ? '#fffbeb' : 'var(--clr-surface)',
              border: `1px solid ${resp.marked_review ? '#fcd34d' : 'var(--clr-border)'}`,
              color: resp.marked_review ? '#92400e' : 'var(--clr-text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={resp.marked_review ? '#f59e0b' : 'none'}
              stroke={resp.marked_review ? '#f59e0b' : 'var(--clr-text-muted)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              color: currentIndex === 0 ? 'var(--clr-text-muted)' : 'var(--clr-text)',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.45 : 1, transition: 'all 0.12s',
            }}
          >
            ← Prev
          </button>

          {/* Next / Submit Section (full only) / Finish Test */}
          <button
            onClick={() => {
              if (isMultiSection) {
                // Full paper: section-aware logic
                if (isLastSection && isLastQInSection) setConfirmSubmit(true);
                else if (isLastQInSection) setConfirmSection(true);
                else goNext();
              } else {
                // Simple CBT: last question → submit, otherwise next
                if (isLastQInSection) setConfirmSubmit(true);
                else goNext();
              }
            }}
            style={{
              padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: isLastQInSection ? '#16a34a' : '#6366f1',
              border: 'none', color: '#fff', cursor: 'pointer',
              transition: 'opacity 0.12s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {isMultiSection
              ? (isLastSection && isLastQInSection
                  ? 'Finish Test'
                  : isLastQInSection ? 'Submit Section →' : 'Next →')
              : (isLastQInSection ? 'Finish Test' : 'Next →')
            }
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          RIGHT — Question palette
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        width: 228, flexShrink: 0,
        borderLeft: '1px solid var(--clr-border)',
        background: 'var(--clr-surface)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Section tabs — full papers only */}
        {isMultiSection && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--clr-border)', flexShrink: 0 }}>
            {sections.map((s, i) => {
              const isActive    = i === currentSectionIndex;
              const isSubmitted = s.status === 'submitted';
              const isLocked    = s.status === 'locked';
              return (
                <div key={i}
                  title={isLocked ? 'Locked' : isSubmitted ? 'Submitted' : `Section ${i + 1} — active`}
                  style={{
                    flex: 1, padding: '8px 0', textAlign: 'center',
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#6366f1' : isSubmitted ? '#16a34a' : 'var(--clr-text-muted)',
                    borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                    opacity: isLocked ? 0.35 : 1, cursor: 'default',
                    background: isActive ? 'rgba(99,102,241,0.04)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {isSubmitted ? '✓' : `S${i + 1}`}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{
          padding: '8px 14px', display: 'flex', flexDirection: 'column',
          gap: 5, borderBottom: '1px solid var(--clr-border)', flexShrink: 0,
        }}>
          {[
            { bg: '#6366f1',             label: 'Answered',     count: totalAnswered },
            { bg: 'var(--clr-surface2)', label: 'Not attempted', count: Math.max(0, totalQ - totalAnswered - sectionMarked) },
            { bg: '#f59e0b',             label: 'Marked',        count: sectionMarked },
          ].map(({ bg, label, count }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3, background: bg, flexShrink: 0,
                border: bg === 'var(--clr-surface2)' ? '1px solid var(--clr-border)' : 'none',
              }} />
              <span style={{ fontSize: 11, color: 'var(--clr-text-muted)', flex: 1 }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--clr-text-muted)' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Question grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>
          {/* Label: "Section X · Q1–40" for full papers, "Questions" for simple */}
          <div style={{
            fontSize: 10, color: 'var(--clr-text-muted)', marginBottom: 8,
            fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {isMultiSection
              ? `Section ${currentSectionIndex + 1} · Q${sectionStart + 1}–${sectionStart + qPerSec}`
              : `Questions 1–${totalQ}`
            }
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
            {sectionQuestions.map((qq, localIdx) => {
              const globalIdx  = sectionStart + localIdx;
              const r          = responses[qq.question_id] || {};
              const isAnswered = r.selected_answer !== null;
              const isCurrent  = globalIdx === currentIndex;
              const isReview   = r.marked_review;

              let bg     = 'var(--clr-surface2)';
              let color  = 'var(--clr-text-muted)';
              let border = '1px solid var(--clr-border)';
              if (isReview)        { bg = '#fffbeb'; color = '#92400e'; border = '1px solid #fcd34d'; }
              else if (isAnswered) { bg = '#6366f1'; color = '#fff';    border = '1px solid #4f46e5'; }

              return (
                <button
                  key={qq.question_id}
                  onClick={() => goTo(globalIdx)}
                  title={`Q${globalIdx + 1}${isAnswered ? ' · Answered' : ''}${isReview ? ' · Marked' : ''}`}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 5,
                    background: bg, color, fontSize: 11, fontWeight: 500,
                    border: isCurrent ? '2px solid #6366f1' : border,
                    cursor: 'pointer', transition: 'all 0.1s', outline: 'none',
                    boxShadow: isCurrent ? '0 0 0 2px rgba(99,102,241,0.25)' : 'none',
                  }}
                >
                  {globalIdx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats footer */}
        <div style={{
          padding: '10px 14px', borderTop: '1px solid var(--clr-border)',
          display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, color: 'var(--clr-text-muted)', fontWeight: 600,
            marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {isMultiSection ? 'This section' : 'Progress'}
          </div>
          {[
            { label: 'Answered',      value: sectionAnswered,                color: '#6366f1' },
            { label: 'Not attempted', value: sectionUnanswered,              color: 'var(--clr-text-muted)' },
            { label: 'Marked',        value: sectionMarked,                  color: '#d97706' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--clr-border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--clr-text-muted)' }}>Overall answered</span>
            <span style={{ fontWeight: 600, color: 'var(--clr-text-muted)' }}>{totalAnswered}/{totalQ}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL — Confirm submit section (full papers only)
      ══════════════════════════════════════════════════════════ */}
      {confirmSection && isMultiSection && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 12, padding: '28px 28px 24px', width: 380, maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 8 }}>
              Submit Section {currentSectionIndex + 1}?
            </div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.65, marginBottom: 6 }}>
              You have answered{' '}
              <strong style={{ color: 'var(--clr-text)' }}>{sectionAnswered}</strong>
              {' '}of{' '}
              <strong style={{ color: 'var(--clr-text)' }}>{qPerSec}</strong>
              {' '}questions in this section.
            </p>
            <div style={{
              fontSize: 12, color: '#92400e', background: '#fffbeb',
              border: '1px solid #fcd34d', borderRadius: 8,
              padding: '10px 12px', marginBottom: 6, lineHeight: 1.6,
            }}>
              ⚠️ <strong>You cannot return to this section</strong> once submitted.
              {sectionUnanswered > 0 && (
                <> {sectionUnanswered} unanswered {sectionUnanswered === 1 ? 'question' : 'questions'} will score 0.</>
              )}
            </div>
            {currentSectionIndex + 1 < sections.length && (
              <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Section {currentSectionIndex + 2} will begin immediately after.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmSection(false)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                color: 'var(--clr-text)', cursor: 'pointer',
              }}>
                Continue Section
              </button>
              <button onClick={handleSectionSubmit} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: '#d97706', border: 'none', color: '#fff', cursor: 'pointer',
              }}>
                Submit & Next Section →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL — Confirm final submit
      ══════════════════════════════════════════════════════════ */}
      {confirmSubmit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 12, padding: '28px 28px 24px', width: 360, maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 10 }}>
              Submit Test?
            </div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.65, marginBottom: 6 }}>
              You have answered{' '}
              <strong style={{ color: 'var(--clr-text)' }}>{totalAnswered}</strong>
              {' '}of{' '}
              <strong style={{ color: 'var(--clr-text)' }}>{totalQ}</strong>
              {' '}questions overall.
            </p>
            {totalQ - totalAnswered > 0 && (
              <p style={{
                fontSize: 12, color: '#92400e', background: '#fffbeb',
                border: '1px solid #fcd34d', borderRadius: 6,
                padding: '7px 10px', marginBottom: 20, lineHeight: 1.5,
              }}>
                {totalQ - totalAnswered} unanswered {totalQ - totalAnswered === 1 ? 'question' : 'questions'} will score 0.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setConfirmSubmit(false)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                color: 'var(--clr-text)', cursor: 'pointer',
              }}>
                Continue Test
              </button>
              <button onClick={handleFinalSubmit} disabled={submitting} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: submitting ? '#fca5a5' : '#dc2626',
                border: 'none', color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}>
                {submitting ? 'Submitting…' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL — Section transition (full papers only)
      ══════════════════════════════════════════════════════════ */}
      {showSectionTransition && isMultiSection && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 16, padding: '36px 32px 28px', width: 420,
            maxWidth: '90vw', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#f0fdf4', border: '1px solid #86efac',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 24,
            }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8 }}>
              Section {currentSectionIndex} Complete
            </div>
            {sectionAutoAdvanced && (
              <div style={{
                fontSize: 12, color: '#92400e', background: '#fffbeb',
                border: '1px solid #fcd34d', borderRadius: 6,
                padding: '6px 12px', marginBottom: 12, lineHeight: 1.5,
              }}>
                Time expired — section was auto-submitted.
              </div>
            )}
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
              You are now entering{' '}
              <strong style={{ color: 'var(--clr-text)' }}>Section {currentSectionIndex + 1}</strong>
              {' '}· Questions {sectionStart + 1}–{sectionStart + qPerSec}.
              <br />
              <span style={{ fontSize: 12 }}>{sectionMins} minutes · {qPerSec} questions · cannot go back.</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              {sections.map((s, i) => (
                <div key={i} style={{
                  width: i === currentSectionIndex ? 24 : 10,
                  height: 10, borderRadius: 99,
                  background: s.status === 'submitted' ? '#6366f1'
                            : i === currentSectionIndex ? '#a5b4fc'
                            : 'var(--clr-border)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
            <button
              onClick={dismissSectionTransition}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                background: '#6366f1', border: 'none', color: '#fff',
                cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Begin Section {currentSectionIndex + 1} →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PROCTORING — Warning toast
      ══════════════════════════════════════════════════════════ */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: 10, padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
          minWidth: 320, maxWidth: '90vw',
          animation: 'slideDown 0.25s ease',
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
              Warning {warningCount}: Do not leave the test window
            </div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
              Leaving again will trigger an auto-submit prompt.
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PROCTORING — Exit confirm modal
      ══════════════════════════════════════════════════════════ */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400,
        }}>
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 14, padding: '32px 28px', width: 400,
            maxWidth: '90vw', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚨</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8 }}>
              Are you sure you want to leave?
            </div>
            <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', lineHeight: 1.65, marginBottom: 8 }}>
              You have left the test window <strong>{warningCount} times</strong>.
            </p>
            <div style={{
              fontSize: 13, color: '#991b1b', background: '#fef2f2',
              border: '1px solid #fca5a5', borderRadius: 8,
              padding: '10px 14px', marginBottom: 24, lineHeight: 1.6,
            }}>
              ⚠️ Leaving again will <strong>automatically submit</strong> your test.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={dismissConfirm} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                color: 'var(--clr-text)', cursor: 'pointer',
              }}>
                Return to Test
              </button>
              <button onClick={confirmLeave} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer',
              }}>
                Submit & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback modal ── */}
      {showFeedback && (
        <FeedbackModal onClose={() => {
          setShowFeedback(false);
          navigate(`/analysis/${useTestStore.getState().sessionId}`);
        }} />
      )}
    </div>
  );
}