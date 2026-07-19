import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import useTestStore from '../store/testStore';
import { Card, Btn, Spinner } from '../components/ui/index.jsx';
import { formatTime } from '../utils/helpers';

export default function LiveTestPage() {
  const [liveTest, setLiveTest] = useState(undefined); // undefined = loading, null = none scheduled
  const [now, setNow] = useState(Date.now());
  const [starting, setStarting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const { startLiveTest, reset } = useTestStore();
  const navigate = useNavigate();

  const fetchLiveTest = async () => {
    try {
      const { data } = await testAPI.getLiveTest();
      setLiveTest(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live test');
      setLiveTest(null);
    }
  };

  useEffect(() => {
    reset();
    fetchLiveTest();
    pollRef.current = setInterval(fetchLiveTest, 20000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(pollRef.current); clearInterval(tick); };
  }, []);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    setError('');
    try {
      const res = await startLiveTest();
      if (res.success) {
        navigate('/test/active');
      } else {
        setError(res.message || 'Could not start the live test');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleRegister = async () => {
    if (registering) return;
    setRegistering(true);
    setError('');
    try {
      await testAPI.registerLiveTest();
      await fetchLiveTest();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register for this live quiz');
    } finally {
      setRegistering(false);
    }
  };

  if (liveTest === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 28px)', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          display: 'grid', placeItems: 'center', fontSize: 20,
          boxShadow: '0 6px 16px rgba(99,102,241,0.3)',
        }}>
          🔴
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>Live Quiz</h1>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 13.5, marginTop: 2 }}>
            Everyone attempts the same paper in the same time window — register early, it closes 15 min before start.
          </p>
        </div>
      </div>

      {!liveTest && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗓️</div>
          <div style={{ fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4, fontSize: 15 }}>No live quiz scheduled right now</div>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>Check back later — we'll notify you the moment one is scheduled.</p>
        </Card>
      )}

      {liveTest && (
        <LiveTestCard
          liveTest={liveTest}
          now={now}
          starting={starting}
          registering={registering}
          onStart={handleStart}
          onRegister={handleRegister}
        />
      )}

      {error && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function LiveTestCard({ liveTest, now, starting, registering, onStart, onRegister }) {
  const startsAt = new Date(liveTest.starts_at).getTime();
  const endsAt = new Date(liveTest.ends_at).getTime();
  const isUpcoming = now < startsAt;
  const isLive = now >= startsAt && now < endsAt;
  const isEnded = now >= endsAt;

  const countdownSec = isUpcoming
    ? Math.max(0, Math.ceil((startsAt - now) / 1000))
    : isLive
      ? Math.max(0, Math.ceil((endsAt - now) / 1000))
      : 0;

  const statusMeta = isEnded
    ? { label: 'Ended', color: '#6b7280' }
    : isLive
      ? { label: 'Live now', color: '#16a34a' }
      : { label: 'Upcoming', color: '#f59e0b' };



  const registrationOpen = !!liveTest.registration_open;
  const isRegistered = !!liveTest.is_registered;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header strip */}
      <div style={{
        padding: '16px 20px',
        background: isLive
          ? 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(22,163,74,0.02))'
          : isEnded
            ? 'linear-gradient(135deg, rgba(107,114,128,0.08), rgba(107,114,128,0.02))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))',
        borderBottom: '1px solid var(--clr-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--clr-text)' }}>{liveTest.paper_title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--clr-text-muted)', marginTop: 4 }}>
              {liveTest.total_questions ? `${liveTest.total_questions} questions` : ''}
              {liveTest.duration_minutes ? ` · ${liveTest.duration_minutes} min` : ''}
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 99,
            color: statusMeta.color, background: `${statusMeta.color}1a`,
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMeta.color, display: isLive ? 'block' : 'none', animation: isLive ? 'livePulse 1.4s infinite' : 'none' }} />
            {statusMeta.label}
          </span>
        </div>
      </div>
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <div style={{ padding: 20 }}>
        <div style={{
          background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 12.5,
          display: 'flex', flexDirection: 'column', gap: 5, color: 'var(--clr-text-muted)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Starts</span><span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>{new Date(liveTest.starts_at).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ends</span><span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>{new Date(liveTest.ends_at).toLocaleString()}</span>
          </div>
          {isUpcoming && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Registration closes</span>
              <span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>{new Date(liveTest.registration_closes_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {isUpcoming && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Starts in</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--clr-text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {formatTime(countdownSec)}
            </div>
          </div>
        )}

        {isUpcoming && (
          <div style={{ textAlign: 'center' }}>
            {isRegistered ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
              }}>
                ✓ You're registered — come back when it goes live
              </div>
            ) : registrationOpen ? (
              <Btn onClick={onRegister} loading={registering} style={{ width: '100%' }}>
                {registering ? 'Registering…' : '📝 Register for this quiz'}
              </Btn>
            ) : (
              <div style={{
                padding: '9px 14px', borderRadius: 8, fontSize: 12.5,
                color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
              }}>
                Registration closed — it auto-closes 15 min before the quiz starts.
              </div>
            )}
          </div>
        )}

        {isLive && liveTest.already_attempted && (
          <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: 13 }}>
            ✅ You've already attempted this live test. Check <a href="/history" style={{ color: '#6366f1' }}>your history</a> for results.
          </div>
        )}

        {isLive && !liveTest.already_attempted && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 10 }}>
              Closes in {formatTime(countdownSec)}
            </div>
            <Btn onClick={onStart} loading={starting} style={{ width: '100%' }}>
              {starting ? 'Starting…' : 'Start Live Test →'}
            </Btn>
          </div>
        )}

        {isEnded && (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏁</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4 }}>
              This live test has ended
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--clr-text-muted)', marginBottom: 16 }}>
              {liveTest.already_attempted
                ? 'You took part in this one — see how you did.'
                : "You didn't attempt this quiz. Catch the next one!"}
            </p>
            {liveTest.already_attempted ? (
              <Btn onClick={() => window.location.href = '/history'} variant="secondary" style={{ width: '100%' }}>
                📊 View Your Result
              </Btn>
            ) : (
              <div style={{
                padding: '9px 14px', borderRadius: 8, fontSize: 12.5,
                color: 'var(--clr-text-muted)', background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
              }}>
                Keep an eye on this page for the next scheduled quiz.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}