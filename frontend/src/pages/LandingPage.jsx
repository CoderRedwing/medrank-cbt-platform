import { Link } from 'react-router-dom';

/* ─── tiny helpers ────────────────────────────────────────────────── */
const NAV_H = 64;

/* ═══════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f8f7f4', color: '#1a1a18', minHeight: '100vh' }}>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <Testimonial />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: NAV_H,
      background: 'rgba(248,247,244,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e4e2dd',
      display: 'flex', alignItems: 'center',
      padding: '0 clamp(20px, 5vw, 80px)',
    }}>
      <Logo />
      <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#about">About</NavLink>
        <div style={{ width: 1, height: 20, background: '#e4e2dd', margin: '0 8px' }} />
        <Link to="/login" style={{
          padding: '8px 18px', borderRadius: 8,
          border: '1px solid #d0cdc7',
          fontSize: 14, fontWeight: 500,
          color: '#1a1a18', textDecoration: 'none',
          transition: 'background 160ms',
        }}
          onMouseEnter={e => e.target.style.background = '#f0eeea'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          Log in
        </Link>
        <Link to="/register" style={{
          padding: '8px 18px', borderRadius: 8,
          background: '#2d4a7a', color: '#fff',
          fontSize: 14, fontWeight: 500,
          textDecoration: 'none',
          transition: 'background 160ms',
        }}
          onMouseEnter={e => e.target.style.background = '#1e3560'}
          onMouseLeave={e => e.target.style.background = '#2d4a7a'}
        >
          Get started
        </Link>
      </nav>
    </header>
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
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 600, fontSize: 18, color: '#1a1a18' }}>
        MedRank
      </span>
    </div>
  );
}

function NavLink({ href, children }) {
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
    <section style={{
      padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 80px)',
      maxWidth: 1100, margin: '0 auto',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 60, alignItems: 'center',
    }}>
      {/* Left */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#eef2f8', border: '1px solid #d5dff0',
          borderRadius: 99, padding: '5px 14px',
          fontSize: 13, color: '#2d4a7a', fontWeight: 500,
          marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d4a7a', display: 'inline-block' }} />
          NEET PG · INI-CET · FMGE
        </div>

        <h1 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 'clamp(36px, 4vw, 54px)',
          fontWeight: 600, lineHeight: 1.15,
          color: '#1a1a18', marginBottom: 20,
        }}>
          Prepare smarter.<br />
          <span style={{ color: '#2d4a7a' }}>Rank higher.</span>
        </h1>

        <p style={{
          fontSize: 17, lineHeight: 1.7,
          color: '#6b6860', maxWidth: 460,
          marginBottom: 36,
        }}>
          Full-length mock tests, subject-wise practice, and AI-powered explanations — everything you need to crack your medical PG entrance in one place.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            padding: '13px 28px', borderRadius: 9,
            background: '#2d4a7a', color: '#fff',
            fontSize: 15, fontWeight: 500,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(45,74,122,0.25)',
            transition: 'all 160ms',
          }}
            onMouseEnter={e => { e.target.style.background = '#1e3560'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.background = '#2d4a7a'; e.target.style.transform = 'none'; }}
          >
            Start for free →
          </Link>
          <a href="#features" style={{
            padding: '13px 28px', borderRadius: 9,
            border: '1px solid #d0cdc7',
            background: '#fff', color: '#1a1a18',
            fontSize: 15, fontWeight: 500,
            textDecoration: 'none',
            transition: 'border-color 160ms',
          }}
            onMouseEnter={e => e.target.style.borderColor = '#2d4a7a'}
            onMouseLeave={e => e.target.style.borderColor = '#d0cdc7'}
          >
            See how it works
          </a>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: '#a8a59e' }}>
          Free to join · No credit card required
        </p>
      </div>

      {/* Right — mock UI card */}
      <div style={{ position: 'relative' }}>
        <MockCard />
      </div>
    </section>
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
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#a8a59e', marginBottom: 2 }}>NEET PG Mock · 2024</div>
          <div style={{ fontWeight: 600, color: '#1a1a18' }}>Pharmacology — Q 42 of 200</div>
        </div>
        <div style={{
          background: '#eef2f8', color: '#2d4a7a',
          borderRadius: 8, padding: '6px 12px',
          fontSize: 13, fontWeight: 600,
        }}>
          02:14:08
        </div>
      </div>

      {/* question */}
      <div style={{
        background: '#f8f7f4', borderRadius: 10,
        padding: '16px 18px', fontSize: 14,
        lineHeight: 1.6, color: '#1a1a18',
        marginBottom: 16,
      }}>
        A 45-year-old patient on warfarin therapy is started on rifampicin. What is the expected effect on INR?
      </div>

      {/* options */}
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
          }}>
            {opt.key}
          </span>
          {opt.text}
        </div>
      ))}

      {/* progress bar */}
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
function StatsBar() {
  const stats = [
    { value: '10,000+', label: 'Questions' },
    { value: '19',      label: 'Subjects covered' },
    { value: '50+',     label: 'Mock tests' },
    { value: 'AI',      label: 'Powered explanations' },
  ];
  return (
    <div style={{
      borderTop: '1px solid #e4e2dd',
      borderBottom: '1px solid #e4e2dd',
      background: '#fff',
      padding: '28px clamp(20px, 5vw, 80px)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20, textAlign: 'center',
      }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 28, fontWeight: 600,
              color: '#2d4a7a', marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: '#6b6860' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Features ────────────────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: '📋',
      title: 'Full Mock Tests',
      desc: 'Simulate the real exam with timed 200-question papers. Covers NEET PG, INI-CET, and FMGE patterns with detailed scoring.',
    },
    {
      icon: '🎯',
      title: 'Subject-wise Practice',
      desc: 'Drill down by subject or topic. Identify weak areas fast with per-subject accuracy tracking across all 19 subjects.',
    },
    {
      icon: '🤖',
      title: 'AI Tutor',
      desc: 'Ask follow-up questions on any topic. Get concept explanations, mnemonics, and high-yield summaries generated on demand.',
    },
    {
      icon: '📊',
      title: 'Performance Analytics',
      desc: 'Track score trends over time. See exactly which subjects and topics need the most attention before exam day.',
    },
    {
      icon: '⚡',
      title: 'Instant Explanations',
      desc: 'Every question has a detailed explanation. Review answers immediately after the test or in revision mode.',
    },
    {
      icon: '🏆',
      title: 'Rank Estimation',
      desc: 'Compare your scores against platform averages. Get a realistic sense of where you stand before the actual exam.',
    },
  ];

  return (
    <section id="features" style={{
      padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)',
      maxWidth: 1100, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#2d4a7a', marginBottom: 12,
        }}>
          Everything you need
        </div>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 'clamp(28px, 3vw, 38px)',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {features.map(f => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e4e2dd',
      borderRadius: 12, padding: '24px 26px',
      transition: 'box-shadow 200ms, transform 200ms',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 14 }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 17, fontWeight: 600,
        color: '#1a1a18', marginBottom: 8,
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6b6860' }}>{desc}</p>
    </div>
  );
}

/* ─── Testimonial ─────────────────────────────────────────────────── */
function Testimonial() {
  return (
    <section style={{
      background: '#2d4a7a',
      padding: 'clamp(50px, 7vw, 80px) clamp(20px, 5vw, 80px)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ fontSize: 32, marginBottom: 20, opacity: 0.6 }}>"</div>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 'clamp(18px, 2vw, 22px)',
          lineHeight: 1.65, color: '#e8edf5',
          fontStyle: 'italic', marginBottom: 28,
        }}>
          The subject-wise analysis showed me exactly where I was losing marks. I improved my Pharmacology score by 40% in three weeks just by targeting weak topics.
        </p>
        <div style={{ fontSize: 14, color: '#8fa8cc', fontWeight: 500 }}>
          Dr. Priya S. — NEET PG 2024, Rank 847
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 'clamp(28px, 3vw, 38px)',
          fontWeight: 600, color: '#1a1a18', marginBottom: 16,
        }}>
          Ready to start preparing?
        </h2>
        <p style={{ fontSize: 16, color: '#6b6860', marginBottom: 32 }}>
          Join thousands of PG aspirants already using MedRank to prepare smarter.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            padding: '13px 32px', borderRadius: 9,
            background: '#2d4a7a', color: '#fff',
            fontSize: 15, fontWeight: 500,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(45,74,122,0.25)',
            transition: 'all 160ms',
          }}
            onMouseEnter={e => { e.target.style.background = '#1e3560'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.background = '#2d4a7a'; e.target.style.transform = 'none'; }}
          >
            Create free account
          </Link>
          <Link to="/login" style={{
            padding: '13px 32px', borderRadius: 9,
            border: '1px solid #d0cdc7', background: '#fff',
            color: '#1a1a18', fontSize: 15, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Log in
          </Link>
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
      padding: '24px clamp(20px, 5vw, 80px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <Logo />
      <p style={{ fontSize: 13, color: '#a8a59e' }}>
        © {new Date().getFullYear()} MedRank. Built for PG aspirants.
      </p>
      <div style={{ display: 'flex', gap: 20 }}>
        {['Privacy', 'Terms', 'Contact'].map(l => (
          <a key={l} href="#" style={{ fontSize: 13, color: '#a8a59e', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#1a1a18'}
            onMouseLeave={e => e.target.style.color = '#a8a59e'}
          >
            {l}
          </a>
        ))}
      </div>
    </footer>
  );
}