import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/* ── NEET PG 2025 historical marks → AIR lookup table ─────────── */
const AIR_TABLE = [
  { marks: 700, air: 100   },
  { marks: 680, air: 300   },
  { marks: 660, air: 600   },
  { marks: 645, air: 900   },
  { marks: 630, air: 1200  },
  { marks: 620, air: 1384  },
  { marks: 610, air: 2100  },
  { marks: 600, air: 3049  },
  { marks: 591, air: 4100  },
  { marks: 582, air: 5163  },
  { marks: 571, air: 6961  },
  { marks: 560, air: 8500  },
  { marks: 553, air: 10434 },
  { marks: 540, air: 13000 },
  { marks: 525, air: 16000 },
  { marks: 510, air: 20000 },
  { marks: 490, air: 25000 },
  { marks: 470, air: 31000 },
  { marks: 450, air: 38000 },
  { marks: 420, air: 48000 },
  { marks: 390, air: 60000 },
  { marks: 360, air: 75000 },
  { marks: 300, air: 95000 },
];

/* ── Difficulty multipliers ─────────────────────────────────────── */
const DIFFICULTY_FACTOR = {
  Easy:     { lo: 1.30, hi: 1.55 }, // easy paper → rank inflated (more competition)
  Moderate: { lo: 0.92, hi: 1.08 }, // neutral
  Hard:     { lo: 0.65, hi: 0.82 }, // hard paper → rank improves
};

/* ── Branch zones by AIR ────────────────────────────────────────── */
function getBranchZone(air) {
  if (air <= 500)   return 'MD Radio-diagnosis · MD Dermatology · MD General Medicine';
  if (air <= 1500)  return 'MD General Medicine · MS General Surgery · MD Pediatrics';
  if (air <= 3000)  return 'MD Pediatrics · MS Orthopedics · MD Psychiatry';
  if (air <= 6000)  return 'MS Obstetrics & Gynecology · MD Anesthesia · MD ENT';
  if (air <= 10000) return 'MD Community Medicine · MD Pathology · MD Microbiology';
  if (air <= 20000) return 'MD Biochemistry · MD Physiology · MS Ophthalmology';
  if (air <= 40000) return 'MD Anatomy · MD Pharmacology · MS ENT (private)';
  return 'Private college specialties or DNB';
}

/* ── Interpolate AIR from marks ─────────────────────────────────── */
function interpolateAIR(marks) {
  // Clamp to table range
  if (marks >= AIR_TABLE[0].marks)                        return AIR_TABLE[0].air;
  if (marks <= AIR_TABLE[AIR_TABLE.length - 1].marks)    return AIR_TABLE[AIR_TABLE.length - 1].air;

  for (let i = 0; i < AIR_TABLE.length - 1; i++) {
    const upper = AIR_TABLE[i];
    const lower = AIR_TABLE[i + 1];
    if (marks <= upper.marks && marks >= lower.marks) {
      const t   = (upper.marks - marks) / (upper.marks - lower.marks);
      return Math.round(upper.air + t * (lower.air - upper.air));
    }
  }
  return AIR_TABLE[AIR_TABLE.length - 1].air;
}

/* ── Confidence label ───────────────────────────────────────────── */
function confidence(marks) {
  if (marks >= 570) return { label: 'High', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' };
  if (marks >= 480) return { label: 'Moderate', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' };
  return { label: 'Low', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
}

/* ── Format number with commas ──────────────────────────────────── */
const fmt = (n) => n.toLocaleString('en-IN');

export default function AIRPredictorPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [marks,    setMarks]    = useState(searchParams.get('score') || '');
  const [maxMarks, setMaxMarks] = useState(searchParams.get('max')   || '800');
  const [difficulty, setDifficulty] = useState('Moderate');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');

  const handlePredict = () => {
    setError('');
    const m  = parseFloat(marks);
    const mx = parseFloat(maxMarks);

    if (!marks || isNaN(m))         { setError('Please enter your score.');        return; }
    if (!maxMarks || isNaN(mx) || mx <= 0) { setError('Please enter valid max marks.'); return; }
    if (m < 0 || m > mx)            { setError('Score must be between 0 and max marks.'); return; }

    // Normalise score to /800 (NEET PG 2025 was out of 800)
    const normalised  = Math.round((m / mx) * 800);

    const baseAIR     = interpolateAIR(normalised);
    const factor      = DIFFICULTY_FACTOR[difficulty];
    const airLo       = Math.max(1,    Math.round(baseAIR * factor.lo));
    const airHi       = Math.round(baseAIR * factor.hi);
    const conf        = confidence(normalised);
    const branch      = getBranchZone(Math.round((airLo + airHi) / 2));

    setResult({ normalised, baseAIR, airLo, airHi, conf, branch, difficulty });
  };

  const reset = () => { setResult(null); setMarks(''); setError(''); };

  /* ── Styles ─────────────────────────────────────────────────── */
  const card = {
    background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
    borderRadius: 12, padding: '24px',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--clr-bg)',
      fontFamily: 'var(--font-sans)', padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 20px)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--clr-text-muted)', fontSize: 13, padding: 0,
              marginBottom: 16,
            }}
          >
            ← Back
          </button>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--clr-text)',
            margin: 0, marginBottom: 6,
          }}>
            NEET PG AIR Predictor
          </h1>
          <p style={{ fontSize: 13, color: 'var(--clr-text-muted)', margin: 0, lineHeight: 1.6 }}>
            Predicts your All India Rank based on NEET PG 2025 historical data.
            Enter your mock test score to get an estimated rank range.
          </p>
        </div>

        {/* ── Input card ── */}
        {!result && (
          <div style={card}>
            {/* Score row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>
                  Your Score
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="e.g. 596"
                  min={0}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                    color: 'var(--clr-text)', fontSize: 15, fontWeight: 500,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>
                  Out of
                </label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="800"
                  min={1}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                    color: 'var(--clr-text)', fontSize: 15, fontWeight: 500,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e)  => e.target.style.borderColor = 'var(--clr-border)'}
                />
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 8 }}>
                Paper Difficulty
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Easy', 'Moderate', 'Hard'].map((d) => {
                  const active = difficulty === d;
                  const colors = {
                    Easy:     { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
                    Moderate: { bg: 'rgba(99,102,241,0.08)', border: '#6366f1', text: '#4f46e5' },
                    Hard:     { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
                  };
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: active ? colors[d].bg : 'var(--clr-surface2)',
                        border: `1px solid ${active ? colors[d].border : 'var(--clr-border)'}`,
                        color: active ? colors[d].text : 'var(--clr-text-muted)',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--clr-text-muted)', margin: '7px 0 0', lineHeight: 1.5 }}>
                {difficulty === 'Easy'     && 'Easy papers → more students score high → rank appears worse.'}
                {difficulty === 'Moderate' && 'Moderate papers → neutral adjustment, closest to real exam.'}
                {difficulty === 'Hard'     && 'Hard papers → fewer students score high → rank improves.'}
              </p>
            </div>

            {error && (
              <div style={{
                fontSize: 12, color: '#991b1b', background: '#fef2f2',
                border: '1px solid #fca5a5', borderRadius: 8,
                padding: '9px 12px', marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handlePredict}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                background: '#6366f1', border: 'none', color: '#fff',
                cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Predict My AIR →
            </button>
          </div>
        )}

        {/* ── Result card ── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Main AIR result */}
            <div style={{
              ...card,
              background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
              border: '1px solid #c7d2fe',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6366f1', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Predicted NEET PG AIR
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#312e81', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {fmt(result.airLo)} – {fmt(result.airHi)}
              </div>
              <div style={{ fontSize: 12, color: '#6366f1', marginTop: 6 }}>
                Based on NEET PG 2025 trend analysis
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {[
                { label: 'Your Score',      value: `${result.normalised}/800`, sub: 'Normalised' },
                { label: 'Base AIR',        value: fmt(result.baseAIR),         sub: 'Neutral estimate' },
                { label: 'Confidence',      value: result.conf.label,           sub: 'Prediction quality',
                  valueStyle: { color: result.conf.color } },
              ].map(({ label, value, sub, valueStyle }) => (
                <div key={label} style={{
                  ...card, textAlign: 'center', padding: '16px 12px',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--clr-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--clr-text)', ...valueStyle }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--clr-text-muted)', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Difficulty effect */}
            <div style={{
              ...card,
              background: result.difficulty === 'Easy'
                ? '#f0fdf4' : result.difficulty === 'Hard'
                ? '#fef2f2' : 'var(--clr-surface)',
              border: `1px solid ${result.difficulty === 'Easy' ? '#86efac' : result.difficulty === 'Hard' ? '#fca5a5' : 'var(--clr-border)'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 4 }}>
                📊 Difficulty Adjustment: {result.difficulty} Paper
              </div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
                {result.difficulty === 'Easy' &&
                  'Because the paper was easy, more candidates score high, pushing your rank higher (worse) by ~30–55%. The predicted range accounts for this.'}
                {result.difficulty === 'Moderate' &&
                  'A moderate paper closely mirrors the actual exam. This is the most reliable prediction scenario.'}
                {result.difficulty === 'Hard' &&
                  'Because the paper was hard, fewer candidates score high, improving your rank by ~18–35%. The predicted range accounts for this.'}
              </div>
            </div>

            {/* Branch zone */}
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
                🏥 Likely Branch Zone
              </div>
              <div style={{ fontSize: 13, color: 'var(--clr-text-muted)', lineHeight: 1.7 }}>
                {result.branch}
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 8, opacity: 0.7 }}>
                Branch availability depends on your category, state, and counselling round.
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              ...card,
              background: '#fffbeb', border: '1px solid #fcd34d',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>
                ⚠️ <strong>Disclaimer:</strong> This is a predicted range based on NEET PG 2025 historical data,
                not an official rank. Mock test scores differ from the actual exam. Always refer to the
                official NMC/NBE results for your actual AIR.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={reset}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                  color: 'var(--clr-text)', cursor: 'pointer',
                }}
              >
                ← Try Another Score
              </button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  background: '#6366f1', border: 'none',
                  color: '#fff', cursor: 'pointer',
                }}
              >
                Back to Analysis
              </button>
            </div>
          </div>
        )}

        {/* ── How it works ── */}
        {!result && (
          <div style={{ ...card, marginTop: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 10 }}>
              How this works
            </div>
            {[
              { icon: '📊', text: 'Your score is normalised to /800 (NEET PG 2025 pattern).' },
              { icon: '📈', text: 'AIR is interpolated from actual NEET PG 2025 cutoff data points.' },
              { icon: '⚙️', text: 'A difficulty multiplier adjusts the range based on paper toughness.' },
              { icon: '🎯', text: 'A confidence range is shown instead of a single number, reflecting real variability.' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}