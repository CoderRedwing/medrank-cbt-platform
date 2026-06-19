import { useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function FeedbackModal({ onClose }) {
  const [rating,   setRating]   = useState(0);
  const [hover,    setHover]    = useState(0);
  const [comment,  setComment]  = useState('');
  const [category, setCategory] = useState('General');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const { user, init } = useAuthStore();

  // Don't show if already rated
  if (user?.feedback?.rating) return null;

  const submit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await api.post('/feedback', { rating, comment, category });
      await init();
      setDone(true);
      setTimeout(onClose, 2000);
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--clr-surface)',
        border: '1px solid var(--clr-border)',
        borderRadius: 16,
        padding: '32px 28px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        textAlign: 'center',
      }}>

        {done ? (
          /* ── Success state ── */
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h3 style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 20,
              color: 'var(--clr-text)',
              marginBottom: 6,
            }}>
              Thank you!
            </h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 14 }}>
              Your feedback helps us improve for everyone.
            </p>
          </>
        ) : (
          /* ── Form state ── */
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <h3 style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 20,
              color: 'var(--clr-text)',
              marginBottom: 6,
            }}>
              How was your experience?
            </h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 13, marginBottom: 20 }}>
              Takes 30 seconds · Helps future students
            </p>

            {/* ── Stars ── */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    fontSize: 36,
                    cursor: 'pointer',
                    color: i <= (hover || rating) ? '#f59e0b' : 'var(--clr-border)',
                    transition: 'color 100ms, transform 100ms',
                    display: 'inline-block',
                    transform: i <= (hover || rating) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* ── Rating label ── */}
            {rating > 0 && (
              <div style={{
                fontSize: 12,
                color: 'var(--clr-text-muted)',
                marginBottom: 16,
                marginTop: -12,
              }}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </div>
            )}

            {/* ── Category ── */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                marginBottom: 12,
                border: '1px solid var(--clr-border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--clr-text)',
                background: 'var(--clr-surface2)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option>General</option>
              <option>Bug</option>
              <option>Suggestion</option>
              <option>Content Error</option>
            </select>

            {/* ── Comment ── */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any specific feedback? (optional)"
              rows={3}
              style={{
                width: '100%',
                padding: '9px 12px',
                marginBottom: 16,
                border: '1px solid var(--clr-border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--clr-text)',
                background: 'var(--clr-surface2)',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.6,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e)  => e.target.style.borderColor = '#6366f1'}
              onBlur={(e)   => e.target.style.borderColor = 'var(--clr-border)'}
            />

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid var(--clr-border)',
                  background: 'var(--clr-surface)',
                  fontSize: 14,
                  color: 'var(--clr-text-muted)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--clr-surface2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--clr-surface)'}
              >
                Skip
              </button>
              <button
                onClick={submit}
                disabled={!rating || loading}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 8,
                  background: !rating ? 'var(--clr-border)' : loading ? '#818cf8' : '#6366f1',
                  border: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: !rating || loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Submitting…' : 'Submit feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}