import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';

/* ─── tiny helpers ────────────────────────────────────────────────── */
const NAV_H = 64;

/* ═══════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [ratingData, setRatingData] = React.useState(null);

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/feedback/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setRatingData(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f8f7f4', color: '#1a1a18', minHeight: '100vh' }}>
      <Navbar />
      <Hero />
      <StatsBar ratingData={ratingData} />
      <Features />
      <GetTheApp />
      <Testimonial ratingData={ratingData} />
      <CTA />
      <Footer />
      {/* Floating PWA install button — visible to everyone before login */}
      <PWAFloatingButton />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PWA FLOATING BUTTON + IOS MODAL
   Self-contained — handles Android native prompt + iOS instructions
═══════════════════════════════════════════════════════════════════ */
function PWAFloatingButton() {
  const { installPrompt, canInstall, isIOS, isInstalled, isDismissed, dismiss } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [visible, setVisible] = useState(false);

  // Delay appearance slightly so it doesn't flash on initial render
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Hide if: already installed as PWA, dismissed, or no install path
  if (isInstalled || isDismissed || (!canInstall && !isIOS)) return null;
  if (!visible) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      installPrompt();
    }
  };

  return (
    <>
      <style>{`
        @keyframes pwa-slide-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pwa-float-btn {
          animation: pwa-slide-in 0.3s ease forwards;
        }
        .pwa-float-btn:hover .pwa-float-inner {
          box-shadow: 0 8px 32px rgba(45,74,122,0.35);
          transform: translateY(-2px);
        }
        .pwa-float-inner {
          transition: box-shadow 0.18s ease, transform 0.18s ease;
        }
      `}</style>

      {/* Floating pill button */}
      <div
        className="pwa-float-btn"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={handleClick}
          className="pwa-float-inner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#2d4a7a',
            color: '#fff',
            border: 'none',
            borderRadius: 99,
            padding: '11px 18px 11px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(45,74,122,0.28)',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <span style={{
            width: 28, height: 28,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            📲
          </span>
          {isIOS ? 'Add to Home Screen' : 'Install App'}
        </button>

        {/* Dismiss X */}
        <button
          onClick={dismiss}
          aria-label="Dismiss install button"
          style={{
            width: 28, height: 28,
            background: '#fff',
            border: '1px solid #e4e2dd',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 11,
            color: '#6b6860',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* iOS modal */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
}

/* ─── iOS step-by-step bottom-sheet modal ────────────────────────── */
function IOSInstallModal({ onClose }) {
  const steps = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
      title: 'Tap the Share button',
      desc: 'Find the Share icon (box with ↑ arrow) at the bottom of Safari.',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
      title: 'Tap "Add to Home Screen"',
      desc: 'Scroll down in the Share sheet and tap "Add to Home Screen".',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      title: 'Tap "Add" to confirm',
      desc: 'MedRank will appear on your home screen just like a native app.',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes ios-modal-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .ios-modal-sheet {
          animation: ios-modal-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 998,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Bottom sheet */}
      <div
        className="ios-modal-sheet"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          maxWidth: 480, margin: '0 auto',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '0 24px 40px',
          zIndex: 999,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: 36, height: 4,
          background: '#e4e2dd',
          borderRadius: 99,
          margin: '12px auto 20px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#2d4a7a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a18' }}>Install MedRank</div>
            <div style={{ fontSize: 12, color: '#6b6860', marginTop: 2 }}>iPhone / iPad · Safari only</div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: '#f8f7f4',
              border: '1px solid #e4e2dd',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 14, color: '#6b6860',
            }}
          >✕</button>
        </div>

        {/* Safari-only warning */}
        <div style={{
          background: '#fef3c7', border: '1px solid #fde68a',
          borderRadius: 8, padding: '10px 12px',
          fontSize: 12, color: '#92400e',
          marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>This only works in <strong>Safari</strong>. If you're in Chrome or another browser, open Safari first.</span>
        </div>

        {/* Steps */}
        <div>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 0',
              borderBottom: i < steps.length - 1 ? '1px solid #f0eeea' : 'none',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: '#eef2f8', color: '#2d4a7a',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>{i + 1}</div>

              <div style={{
                width: 36, height: 36,
                background: '#f8f7f4', border: '1px solid #e4e2dd',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#2d4a7a',
              }}>{step.icon}</div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18', marginBottom: 3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#6b6860' }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Done */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 24,
            padding: '14px 0', borderRadius: 10,
            background: '#2d4a7a', color: '#fff',
            fontSize: 15, fontWeight: 600,
            border: 'none', cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────── */
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .landing-nav-links { display: none !important; }
          .landing-hamburger { display: flex !important; }
        }
        .landing-mobile-menu {
          display: none;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          background: rgba(248,247,244,0.98);
          border-bottom: 1px solid #e4e2dd;
          position: absolute;
          top: ${NAV_H}px;
          left: 0; right: 0;
          z-index: 99;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .landing-mobile-menu.open { display: flex; }
        .landing-hamburger { display: none; }
      `}</style>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: NAV_H,
        background: 'rgba(248,247,244,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e4e2dd',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(16px, 5vw, 80px)',
      }}>
        <Logo />

        {/* Desktop nav */}
        <nav className="landing-nav-links" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavAnchor href="#features">Features</NavAnchor>
          <NavAnchor href="#get-the-app">Get the App</NavAnchor>
          <NavAnchor href="#about">About</NavAnchor>
          <div style={{ width: 1, height: 20, background: '#e4e2dd', margin: '0 8px' }} />
          <Link to="/login" style={{
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid #d0cdc7',
            fontSize: 14, fontWeight: 500,
            color: '#1a1a18', textDecoration: 'none',
          }}>Log in</Link>
          <Link to="/register" style={{
            padding: '8px 18px', borderRadius: 8,
            background: '#2d4a7a', color: '#fff',
            fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}>Get started</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="landing-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{
            marginLeft: 'auto',
            width: 38, height: 38,
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--clr-surface2)', border: '1px solid #e4e2dd',
            borderRadius: 8, cursor: 'pointer',
          }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen
            ? <span style={{ fontSize: 18 }}>✕</span>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a18" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
          }
        </button>
      </header>

      {/* Mobile dropdown menu */}
      <div className={`landing-mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <a href="#features" onClick={() => setMobileMenuOpen(false)}
          style={{ padding: '10px 12px', borderRadius: 8, fontSize: 15, color: '#6b6860', fontWeight: 500 }}>
          Features
        </a>
        <a href="#get-the-app" onClick={() => setMobileMenuOpen(false)}
          style={{ padding: '10px 12px', borderRadius: 8, fontSize: 15, color: '#6b6860', fontWeight: 500 }}>
          Get the App
        </a>
        <a href="#about" onClick={() => setMobileMenuOpen(false)}
          style={{ padding: '10px 12px', borderRadius: 8, fontSize: 15, color: '#6b6860', fontWeight: 500 }}>
          About
        </a>
        <div style={{ height: 1, background: '#e4e2dd', margin: '4px 0' }} />
        <Link to="/login" onClick={() => setMobileMenuOpen(false)}
          style={{
            padding: '11px 12px', borderRadius: 8,
            border: '1px solid #d0cdc7',
            fontSize: 15, fontWeight: 500, color: '#1a1a18', textAlign: 'center',
          }}>Log in</Link>
        <Link to="/register" onClick={() => setMobileMenuOpen(false)}
          style={{
            padding: '11px 12px', borderRadius: 8,
            background: '#2d4a7a', color: '#fff',
            fontSize: 15, fontWeight: 600, textAlign: 'center',
          }}>Get started →</Link>
      </div>
    </>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: '#2d4a7a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 600, fontSize: 18, color: '#1a1a18' }}>
        MedRank
      </span>
    </div>
  );
}

function NavAnchor({ href, children }) {
  return (
    <a href={href} style={{
      padding: '6px 12px', borderRadius: 6,
      fontSize: 14, color: '#6b6860',
      textDecoration: 'none',
      transition: 'color 160ms',
    }}
      onMouseEnter={e => e.target.style.color = '#1a1a18'}
      onMouseLeave={e => e.target.style.color = '#6b6860'}
    >
      {children}
    </a>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <>
      <style>{`
        .hero-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .hero-mock { display: block; }
        @media (max-width: 768px) {
          .hero-inner {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .hero-mock { display: none; }
        }
      `}</style>
      <section style={{
        padding: 'clamp(40px, 8vw, 120px) clamp(16px, 5vw, 80px)',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <div className="hero-inner">
          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#eef2f8', border: '1px solid #d5dff0',
              borderRadius: 99, padding: '5px 14px',
              fontSize: 13, color: '#2d4a7a', fontWeight: 500,
              marginBottom: 24,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d4a7a', display: 'inline-block' }} />
              NEET PG · INI-CET · FMGE
            </div>

            <h1 style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 'clamp(30px, 5vw, 54px)',
              fontWeight: 600, lineHeight: 1.15,
              color: '#1a1a18', marginBottom: 18,
            }}>
              Prepare smarter.<br />
              <span style={{ color: '#2d4a7a' }}>Rank higher.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.7,
              color: '#6b6860', maxWidth: 460,
              marginBottom: 32,
            }}>
              Full-length mock tests, subject-wise practice, and AI-powered explanations — everything you need to crack your medical PG entrance in one place.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                padding: 'clamp(10px, 2vw, 13px) clamp(20px, 3vw, 28px)',
                borderRadius: 9,
                background: '#2d4a7a', color: '#fff',
                fontSize: 15, fontWeight: 500,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(45,74,122,0.25)',
              }}>
                Start for free →
              </Link>
              <a href="#features" style={{
                padding: 'clamp(10px, 2vw, 13px) clamp(20px, 3vw, 28px)',
                borderRadius: 9,
                border: '1px solid #d0cdc7',
                background: '#fff', color: '#1a1a18',
                fontSize: 15, fontWeight: 500,
                textDecoration: 'none',
              }}>
                See how it works
              </a>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: '#a8a59e' }}>
              Free to join · No credit card required
            </p>
          </div>

          {/* Right — mock UI card (hidden on mobile) */}
          <div className="hero-mock">
            <MockCard />
          </div>
        </div>
      </section>
    </>
  );
}

function MockCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e4e2dd',
      borderRadius: 16,
      padding: 28,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#a8a59e', marginBottom: 2 }}>NEET PG Mock · 2024</div>
          <div style={{ fontWeight: 600, color: '#1a1a18' }}>Pharmacology — Q 42 of 200</div>
        </div>
        <div style={{
          background: '#eef2f8', color: '#2d4a7a',
          borderRadius: 8, padding: '6px 12px',
          fontSize: 13, fontWeight: 600,
        }}>02:14:08</div>
      </div>

      <div style={{
        background: '#f8f7f4', borderRadius: 10,
        padding: '16px 18px', fontSize: 14,
        lineHeight: 1.6, color: '#1a1a18',
        marginBottom: 16,
      }}>
        A 45-year-old patient on warfarin therapy is started on rifampicin. What is the expected effect on INR?
      </div>

      {[
        { key: 'A', text: 'INR increases significantly', selected: false },
        { key: 'B', text: 'INR decreases due to enzyme induction', selected: true },
        { key: 'C', text: 'No change in INR', selected: false },
        { key: 'D', text: 'INR becomes unpredictable', selected: false },
      ].map(opt => (
        <div key={opt.key} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 8, marginBottom: 8,
          border: `1px solid ${opt.selected ? '#2d4a7a' : '#e4e2dd'}`,
          background: opt.selected ? '#eef2f8' : '#fff',
          fontSize: 14, color: opt.selected ? '#2d4a7a' : '#1a1a18',
          fontWeight: opt.selected ? 500 : 400,
        }}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%',
            border: `1.5px solid ${opt.selected ? '#2d4a7a' : '#d0cdc7'}`,
            background: opt.selected ? '#2d4a7a' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: opt.selected ? '#fff' : '#6b6860',
            flexShrink: 0, fontWeight: 600,
          }}>{opt.key}</span>
          {opt.text}
        </div>
      ))}

      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a8a59e', marginBottom: 6 }}>
          <span>Progress</span><span>42 / 200</span>
        </div>
        <div style={{ height: 4, background: '#f0eeea', borderRadius: 99 }}>
          <div style={{ width: '21%', height: '100%', background: '#2d4a7a', borderRadius: 99 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Stats Bar ───────────────────────────────────────────────────── */
function StatsBar({ ratingData }) {
  const stats = [
    { value: '10,000+', label: 'Questions' },
    { value: '19',      label: 'Subjects covered' },
    { value: '50+',     label: 'Mock tests' },
    { value: ratingData ? `${ratingData.average}★` : '—', label: `Rating · ${ratingData?.total || 0} reviews` },
  ];
  return (
    <>
      <style>{`
        .stats-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          text-align: center;
        }
        @media (max-width: 480px) {
          .stats-grid-4 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      <div style={{
        borderTop: '1px solid #e4e2dd',
        borderBottom: '1px solid #e4e2dd',
        background: '#fff',
        padding: '24px clamp(16px, 5vw, 80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="stats-grid-4">
            {stats.map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 600,
                  color: '#2d4a7a', marginBottom: 4,
                }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#6b6860' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Features ────────────────────────────────────────────────────── */
function Features() {
  const features = [
    { icon: '📋', title: 'Full Mock Tests', desc: 'Simulate the real exam with timed 200-question papers. Covers NEET PG, INI-CET, and FMGE patterns with detailed scoring.' },
    { icon: '🎯', title: 'Subject-wise Practice', desc: 'Drill down by subject or topic. Identify weak areas fast with per-subject accuracy tracking across all 19 subjects.' },
    { icon: '🤖', title: 'AI Tutor', desc: 'Ask follow-up questions on any topic. Get concept explanations, mnemonics, and high-yield summaries generated on demand.' },
    { icon: '📊', title: 'Performance Analytics', desc: 'Track score trends over time. See exactly which subjects and topics need the most attention before exam day.' },
    { icon: '⚡', title: 'Instant Explanations', desc: 'Every question has a detailed explanation. Review answers immediately after the test or in revision mode.' },
    { icon: '🏆', title: 'Rank Estimation', desc: 'Compare your scores against platform averages. Get a realistic sense of where you stand before the actual exam.' },
  ];

  return (
    <section id="features" style={{
      padding: 'clamp(48px, 8vw, 100px) clamp(16px, 5vw, 80px)',
      maxWidth: 1100, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2d4a7a', marginBottom: 12 }}>
          Everything you need
        </div>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 'clamp(24px, 3vw, 38px)',
          fontWeight: 600, color: '#1a1a18', marginBottom: 14,
        }}>
          Built for serious PG aspirants
        </h2>
        <p style={{ fontSize: 16, color: '#6b6860', maxWidth: 480, margin: '0 auto' }}>
          Not just a question bank — a complete preparation system.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: 16,
      }}>
        {features.map(f => <FeatureCard key={f.title} {...f} />)}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e4e2dd',
      borderRadius: 12, padding: '22px 22px',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 17, fontWeight: 600, color: '#1a1a18', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6b6860' }}>{desc}</p>
    </div>
  );
}

/* ─── Get the App ─────────────────────────────────────────────────── */
function GetTheApp() {
  const [activeTab, setActiveTab] = useState('android');
  const { installPrompt, canInstall, isIOS, isInstalled } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Determine if we should show the smart install CTA
  const showSmartCTA = !isInstalled && (canInstall || isIOS);

  const handleSmartInstall = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      installPrompt();
    }
  };

  const androidSteps = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      title: 'Open in Chrome',
      desc: 'Visit medrank.app in Chrome on your Android phone.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      ),
      title: 'Tap the menu (⋮)',
      desc: 'Tap the three-dot menu in the top-right corner of Chrome.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: 'Add to Home Screen',
      desc: 'Tap "Add to Home screen" and confirm. Done — MedRank is now on your home screen.',
    },
  ];

  const iosSteps = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      title: 'Open in Safari',
      desc: 'Visit medrank.app in Safari on your iPhone or iPad. Does not work in Chrome on iOS.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      ),
      title: 'Tap the Share button',
      desc: 'Tap the Share icon (box with arrow) at the bottom of Safari.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: 'Add to Home Screen',
      desc: 'Scroll down in the Share sheet and tap "Add to Home Screen", then tap Add.',
    },
  ];

  const steps = activeTab === 'android' ? androidSteps : iosSteps;

  return (
    <>
      <style>{`
        .app-section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .app-section-visual { display: block; }
        @media (max-width: 768px) {
          .app-section-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .app-section-visual { display: none; }
        }
        .app-tab-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: 1px solid #e4e2dd;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 160ms;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .app-tab-btn.active {
          background: #2d4a7a;
          color: #fff;
          border-color: #2d4a7a;
        }
        .app-tab-btn:not(.active) {
          color: #6b6860;
        }
        .app-tab-btn:not(.active):hover {
          border-color: #2d4a7a;
          color: #2d4a7a;
        }
        .app-step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 16px 0;
          border-bottom: 1px solid #f0eeea;
        }
        .app-step:last-child { border-bottom: none; }
        .app-step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #eef2f8;
          color: #2d4a7a;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .app-step-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #eef2f8;
          color: #2d4a7a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .smart-install-btn {
          transition: opacity 0.15s, transform 0.15s;
        }
        .smart-install-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
      `}</style>

      <section id="get-the-app" style={{
        background: '#fff',
        borderTop: '1px solid #e4e2dd',
        borderBottom: '1px solid #e4e2dd',
        padding: 'clamp(48px, 8vw, 100px) clamp(16px, 5vw, 80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="app-section-grid">

            {/* Left: text + steps */}
            <div>
              {/* Eyebrow */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#eef2f8', border: '1px solid #d5dff0',
                borderRadius: 99, padding: '4px 12px',
                fontSize: 12, color: '#2d4a7a', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                📱 No App Store needed
              </div>

              <h2 style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 600, lineHeight: 1.2,
                color: '#1a1a18', marginBottom: 12,
              }}>
                Install MedRank on<br />your phone
              </h2>

              <p style={{
                fontSize: 15, lineHeight: 1.7,
                color: '#6b6860', marginBottom: 28,
                maxWidth: 440,
              }}>
                MedRank works like a native app — opens full screen, works offline for cached content, and lives on your home screen. No Play Store, no App Store, no downloads.
              </p>

              {/* ── Smart install CTA (shown when browser supports it) ── */}
              {showSmartCTA && (
                <div style={{
                  background: 'linear-gradient(135deg, #eef2f8 0%, #e4ecf7 100%)',
                  border: '1px solid #d5dff0',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 28,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, flexShrink: 0,
                    background: '#2d4a7a', borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    📲
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18', marginBottom: 2 }}>
                      {isIOS ? 'Add to your Home Screen' : 'Install MedRank now'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b6860' }}>
                      {isIOS
                        ? 'One tap to see Safari instructions'
                        : 'One tap — no App Store needed'}
                    </div>
                  </div>
                  <button
                    onClick={handleSmartInstall}
                    className="smart-install-btn"
                    style={{
                      background: '#2d4a7a', color: '#fff',
                      padding: '10px 18px', borderRadius: 9,
                      fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {isIOS ? 'How to install' : 'Install App'}
                  </button>
                </div>
              )}

              {/* OS Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button
                  className={`app-tab-btn${activeTab === 'android' ? ' active' : ''}`}
                  onClick={() => setActiveTab('android')}
                >
                  🤖 Android
                </button>
                <button
                  className={`app-tab-btn${activeTab === 'ios' ? ' active' : ''}`}
                  onClick={() => setActiveTab('ios')}
                >
                  🍎 iPhone / iPad
                </button>
              </div>

              {/* Steps */}
              <div>
                {steps.map((step, i) => (
                  <div key={i} className="app-step">
                    <div className="app-step-num">{i + 1}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div className="app-step-icon">{step.icon}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18', marginBottom: 3 }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#6b6860' }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Benefit pills */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24,
              }}>
                {['Works offline', 'No storage space', 'Home screen icon', 'Fast & lightweight'].map(b => (
                  <span key={b} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: '#f8f7f4', border: '1px solid #e4e2dd',
                    borderRadius: 99, padding: '4px 12px',
                    fontSize: 12, color: '#6b6860',
                  }}>
                    <span style={{ color: '#5a7a5a', fontWeight: 700 }}>✓</span> {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: phone mockup visual */}
            <div className="app-section-visual" style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* iOS modal triggered from GetTheApp section */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
}

/* ─── Phone mockup SVG ────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div style={{ position: 'relative', width: 260 }}>
      {/* Phone shell */}
      <div style={{
        width: 260, height: 520,
        background: '#1a1a18',
        borderRadius: 40,
        padding: '16px 12px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          width: 80, height: 22,
          background: '#1a1a18',
          borderRadius: 99,
          position: 'absolute', top: 16, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }} />

        {/* Screen */}
        <div style={{
          width: '100%', height: '100%',
          background: '#f8f7f4',
          borderRadius: 30,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Status bar */}
          <div style={{
            height: 28, background: '#fff',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px', paddingTop: 4,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#1a1a18' }}>9:41</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 14, height: 8, border: '1.5px solid #1a1a18', borderRadius: 2, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 1, left: 1, width: '75%', height: 'calc(100% - 2px)', background: '#1a1a18', borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div style={{
            background: '#fff', padding: '10px 14px',
            borderBottom: '1px solid #e4e2dd',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: '#2d4a7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10 }}>✚</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1a1a18', fontFamily: "'Lora', serif" }}>MedRank</span>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2d4a7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>R</span>
            </div>
          </div>

          {/* Dashboard content preview */}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a18', marginBottom: 2 }}>Welcome back 👋</div>
            <div style={{ fontSize: 9, color: '#6b6860', marginBottom: 12 }}>Target: NEET PG · 8 tests done</div>

            {/* Stat cards 2x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {[
                { label: 'Tests taken', value: '8', color: '#6366f1' },
                { label: 'Avg accuracy', value: '52%', color: '#d97706' },
                { label: 'Avg score', value: '64%', color: '#2d4a7a' },
                { label: 'Qs attempted', value: '71', color: '#16a34a' },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#fff', border: '1px solid #e4e2dd',
                  borderRadius: 8, padding: '8px 10px',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 8, color: '#a8a59e', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Mini chart placeholder */}
            <div style={{
              background: '#fff', border: '1px solid #e4e2dd',
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1a1a18', marginBottom: 6 }}>Score trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 30 }}>
                {[40, 55, 45, 60, 50, 70, 65, 80].map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h}%`,
                    background: i === 7 ? '#2d4a7a' : '#d5dff0',
                    borderRadius: 2,
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff', borderTop: '1px solid #e4e2dd',
            display: 'flex', justifyContent: 'space-around',
            padding: '8px 0 10px',
          }}>
            {['🏠', '📝', '📋', '📊', '👤'].map((icon, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <div style={{ width: i === 0 ? 16 : 0, height: 2, background: '#2d4a7a', borderRadius: 99 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Install prompt bubble */}
      <div style={{
        position: 'absolute',
        bottom: 60, right: -40,
        background: '#fff',
        border: '1px solid #e4e2dd',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        width: 160,
        fontSize: 11,
        lineHeight: 1.4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#2d4a7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10 }}>✚</span>
          </div>
          <span style={{ fontWeight: 600, color: '#1a1a18', fontSize: 11 }}>Add to Home Screen?</span>
        </div>
        <div style={{ color: '#6b6860', marginBottom: 8 }}>MedRank CBT wants to be installed on your device.</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: '1px solid #e4e2dd', background: '#fff', fontSize: 10, cursor: 'pointer', color: '#6b6860' }}>Cancel</button>
          <button style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', background: '#2d4a7a', fontSize: 10, cursor: 'pointer', color: '#fff', fontWeight: 600 }}>Add</button>
        </div>
        {/* Arrow */}
        <div style={{
          position: 'absolute', bottom: -7, left: 20,
          width: 13, height: 13,
          background: '#fff', border: '1px solid #e4e2dd',
          transform: 'rotate(45deg)',
          borderTop: 'none', borderLeft: 'none',
        }} />
      </div>
    </div>
  );
}

/* ─── Stars helper ────────────────────────────────────────────────── */
function Stars({ rating, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#d0cdc7' }}>★</span>
      ))}
    </div>
  );
}

/* ─── Testimonial ─────────────────────────────────────────────────── */
function Testimonial({ ratingData }) {
  const reviews = ratingData?.recent || [];
  const fallback = [{
    name: 'Dr. Priya S.',
    targetExam: 'NEET_PG',
    rating: 5,
    comment: 'The subject-wise analysis showed me exactly where I was losing marks. I improved my Pharmacology score by 40% in three weeks.',
    testsCount: 14,
  }];
  const items = reviews.length > 0 ? reviews : fallback;

  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid #e4e2dd',
      borderBottom: '1px solid #e4e2dd',
      padding: 'clamp(40px, 7vw, 80px) clamp(16px, 5vw, 80px)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2d4a7a', marginBottom: 10 }}>
            Student reviews
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 42, fontWeight: 600, color: '#1a1a18' }}>
              {ratingData?.average || '—'}
            </span>
            <div>
              <Stars rating={ratingData?.average || 0} size={20} />
              <div style={{ fontSize: 13, color: '#6b6860', marginTop: 3 }}>
                {ratingData?.total || 0} verified student{ratingData?.total !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 14,
        }}>
          {items.map((r, i) => (
            <div key={i} style={{
              background: '#f8f7f4',
              border: '1px solid #e4e2dd',
              borderRadius: 12, padding: '18px 20px',
            }}>
              <Stars rating={r.rating} size={14} />
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#1a1a18', margin: '10px 0 14px', fontStyle: 'italic' }}>
                "{r.comment}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#6b6860' }}>{r.targetExam?.replace('_', ' ')}</div>
                </div>
                <div style={{ fontSize: 11, color: '#2d4a7a', background: '#eef2f8', borderRadius: 99, padding: '3px 8px', fontWeight: 500 }}>
                  ✓ {r.testsCount} tests
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{
      padding: 'clamp(48px, 8vw, 100px) clamp(16px, 5vw, 80px)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 'clamp(24px, 3vw, 38px)',
          fontWeight: 600, color: '#1a1a18', marginBottom: 16,
        }}>Ready to start preparing?</h2>
        <p style={{ fontSize: 16, color: '#6b6860', marginBottom: 28 }}>
          Join thousands of PG aspirants already using MedRank to prepare smarter.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            padding: '13px 28px', borderRadius: 9,
            background: '#2d4a7a', color: '#fff',
            fontSize: 15, fontWeight: 500, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(45,74,122,0.25)',
          }}>Create free account</Link>
          <Link to="/login" style={{
            padding: '13px 28px', borderRadius: 9,
            border: '1px solid #d0cdc7', background: '#fff',
            color: '#1a1a18', fontSize: 15, fontWeight: 500, textDecoration: 'none',
          }}>Log in</Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #e4e2dd',
      padding: '20px clamp(16px, 5vw, 80px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <Logo />
      <p style={{ fontSize: 13, color: '#a8a59e' }}>
        © {new Date().getFullYear()} MedRank. Built for PG aspirants.
      </p>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {['Privacy', 'Terms', 'Contact'].map(l => (
          <a key={l} href="#" style={{ fontSize: 13, color: '#a8a59e', textDecoration: 'none' }}>{l}</a>
        ))}
        <a
          href="https://t.me/+ZI-caFRnCWo2ZTU9"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0088cc', textDecoration: 'none', fontWeight: 600 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0088cc">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.4l-2.948-.924c-.64-.203-.654-.64.136-.954l11.527-4.448c.535-.194 1.002.131.587.174z"/>
          </svg>
          Telegram
        </a>
      </div>
    </footer>
  );
}