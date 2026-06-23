import { Link } from 'react-router-dom';

export default function AuthLayout({
  title,
  subtitle,
  children,
}) {
  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-card {
          animation: fadeSlideIn .35s ease;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'var(--clr-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
          }}
        >
          {/* Brand */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background:
                      'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 18,
                  }}
                >
                  🩺
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 22,
                    color: 'var(--clr-text)',
                  }}
                >
                  MedRank{' '}
                  <span
                    style={{
                      color: '#6366f1',
                    }}
                  >
                    CBT
                  </span>
                </span>
              </div>
            </Link>

            <p
              style={{
                color: 'var(--clr-text-muted)',
                fontSize: 13,
              }}
            >
              Medical Entrance Preparation Platform
            </p>
          </div>

          {/* Card */}
          <div
            className="auth-card"
            style={{
              background: 'var(--clr-surface)',
              border: '1px solid var(--clr-border)',
              borderRadius: 16,
              padding: '32px 28px',
              boxShadow:
                '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            {title && (
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--clr-text)',
                  marginBottom: 8,
                }}
              >
                {title}
              </h1>
            )}

            {subtitle && (
              <p
                style={{
                  color: 'var(--clr-text-muted)',
                  fontSize: 14,
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </p>
            )}

            {children}
          </div>
        </div>
      </div>
    </>
  );
}