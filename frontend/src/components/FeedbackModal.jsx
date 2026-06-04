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
    } catch (err) {
      // silently close — don't block the user
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        padding: '32px 28px', maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        textAlign: 'center',
      }}>
        {done ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, color: '#1a1a18' }}>
              Thank you!
            </h3>
            <p style={{ color: '#6b6860', fontSize: 14, marginTop: 6 }}>
              Your feedback helps us improve for everyone.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, color: '#1a1a18', marginBottom: 6 }}>
              How was your experience?
            </h3>
            <p style={{ color: '#6b6860', fontSize: 13, marginBottom: 20 }}>
              Takes 30 seconds · Helps future students
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    fontSize: 36, cursor: 'pointer',
                    color: i <= (hover || rating) ? '#f59e0b' : '#d0cdc7',
                    transition: 'color 100ms',
                  }}
                >★</span>
              ))}
            </div>

            {/* Category */}
            <select value={category} onChange={e => setCategory(e.target.value)} style={{
              width: '100%', padding: '9px 12px', marginBottom: 12,
              border: '1px solid #e4e2dd', borderRadius: 8,
              fontSize: 13, color: '#1a1a18', background: '#f8f7f4',
            }}>
              <option>General</option>
              <option>Bug</option>
              <option>Suggestion</option>
              <option>Content Error</option>
            </select>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Any specific feedback? (optional)"
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', marginBottom: 16,
                border: '1px solid #e4e2dd', borderRadius: 8,
                fontSize: 13, color: '#1a1a18', background: '#f8f7f4',
                resize: 'none', outline: 'none', boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '10px', borderRadius: 8,
                border: '1px solid #e4e2dd', background: '#fff',
                fontSize: 14, color: '#6b6860', cursor: 'pointer',
              }}>
                Skip
              </button>
              <button onClick={submit} disabled={!rating || loading} style={{
                flex: 2, padding: '10px', borderRadius: 8,
                background: rating ? '#2d4a7a' : '#d0cdc7',
                border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 500, cursor: rating ? 'pointer' : 'not-allowed',
                transition: 'background 160ms',
              }}>
                {loading ? 'Submitting…' : 'Submit feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}