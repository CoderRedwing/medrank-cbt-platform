import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/* ═══════════════════════════════════════════════════════════════════
   PWAInstallBanner
   Drop this right after the Telegram banner in DashboardPage.
   It handles Android, iOS, and already-installed cases automatically.
═══════════════════════════════════════════════════════════════════ */
export default function PWAInstallBanner() {
  const { installPrompt, canInstall, isIOS, isInstalled, isDismissed, dismiss } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Hide if: already installed, dismissed, or no install path available
  if (isInstalled || isDismissed || (!canInstall && !isIOS)) return null;

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSModal(true);   // show manual instructions for iOS
    } else {
      installPrompt();          // trigger native Android dialog
    }
  };

  return (
    <>
      {/* ── Banner ───────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2f8 0%, #e8edf8 100%)',
        border: '1px solid #d5dff0',
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
        position: 'relative',
      }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, flexShrink: 0,
          background: '#2d4a7a',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneIcon />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--clr-text)', fontSize: 13 }}>
            Install MedRank on your phone
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--clr-text-muted)' }}>
            {isIOS
              ? 'Add to Home Screen via Safari for the best experience'
              : 'Install as an app — faster access, works offline'}
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstallClick}
          style={{
            background: '#2d4a7a', color: '#fff',
            padding: '8px 16px', borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
            minHeight: 36,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {isIOS ? 'How to install' : 'Install App'}
        </button>

        {/* Dismiss X */}
        <button
          onClick={dismiss}
          aria-label="Dismiss install banner"
          style={{
            position: 'absolute', top: 10, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--clr-text-muted)', fontSize: 16, lineHeight: 1,
            padding: 2,
          }}
        >
          ✕
        </button>
      </div>

      {/* ── iOS Install Modal ─────────────────────────────────────── */}
      {showIOSModal && (
        <IOSInstallModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
}

/* ─── iOS step-by-step modal ─────────────────────────────────────── */
function IOSInstallModal({ onClose }) {
  const steps = [
    {
      icon: <ShareIcon />,
      title: 'Tap the Share button',
      desc: 'Find the Share icon (□ with ↑ arrow) at the bottom of your Safari browser.',
    },
    {
      icon: <PlusSquareIcon />,
      title: 'Tap "Add to Home Screen"',
      desc: 'Scroll down in the Share sheet and tap "Add to Home Screen".',
    },
    {
      icon: <CheckIcon />,
      title: 'Tap "Add" to confirm',
      desc: 'MedRank will appear on your home screen just like a native app.',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,      // bottom sheet on mobile
        maxWidth: 480, margin: '0 auto',    // centred on desktop
        background: 'var(--clr-surface)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 36px',
        zIndex: 1000,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.25s ease',
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{
          width: 36, height: 4,
          background: 'var(--clr-border)',
          borderRadius: 99, margin: '0 auto 20px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#2d4a7a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PhoneIcon size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--clr-text)' }}>
              Install MedRank
            </div>
            <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>
              iPhone / iPad · Safari only
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'var(--clr-surface2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 14, color: 'var(--clr-text-muted)',
            }}
          >✕</button>
        </div>

        {/* Safari-only note */}
        <div style={{
          background: '#fef3c7', border: '1px solid #fde68a',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 12, color: '#92400e',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span>
          <span>This only works in <strong>Safari</strong>. If you're in Chrome or another browser, open Safari first.</span>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 0',
              borderBottom: i < steps.length - 1 ? '1px solid var(--clr-border)' : 'none',
            }}>
              {/* Step number */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: '#eef2f8', color: '#2d4a7a',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>{i + 1}</div>

              {/* Icon */}
              <div style={{
                width: 36, height: 36,
                background: 'var(--clr-surface2)',
                border: '1px solid var(--clr-border)',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#2d4a7a',
              }}>{step.icon}</div>

              {/* Text */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--clr-text-muted)' }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Done button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 24,
            padding: '13px 0', borderRadius: 10,
            background: '#2d4a7a', color: '#fff',
            fontSize: 15, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            minHeight: 48,
          }}
        >
          Got it
        </button>
      </div>
    </>
  );
}

/* ─── SVG icons ──────────────────────────────────────────────────── */
function PhoneIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}