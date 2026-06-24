'use strict';

const crypto = require('crypto');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Doctor';
  const trimmed = fullName.trim().replace(/^Dr\.?\s*/i, '');
  if (!trimmed) return 'Doctor';
  return trimmed.split(/\s+/)[0];
}

const EXAM_LABELS = {
  NEET_PG: 'NEET PG',
  INI_CET: 'INI-CET',
  FMGE:    'FMGE',
};

// ── Shared design tokens ──────────────────────────────────────────────────────

const BRAND = {
  primary:      '#4f46e5',
  primaryDark:  '#4338ca',
  dark:         '#1e293b',
  bodyBg:       '#f1f5f9',
  cardBg:       '#ffffff',
  border:       '#e2e8f0',
  textBody:     '#334155',
  textMuted:    '#64748b',
  textLight:    '#94a3b8',
  textFooter:   '#cbd5e1',
  accentBg:     '#eef2ff',
  warningBg:    '#fefce8',
  warningBorder:'#fde68a',
  warningText:  '#92400e',
  successBg:    '#f0fdf4',
  successBorder:'#bbf7d0',
  successText:  '#166534',
};

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

const ADDRESS  = 'B-42, Sector 62, Noida, Uttar Pradesh 201301, India';
const SUPPORT  = 'noreply.medrankcbt@gmail.com';
const TELEGRAM = 'https://t.me/+ZI-caFRnCWo2ZTU9';
const YEAR     = new Date().getFullYear();

// ── Shared email shell (header wordmark + footer) ─────────────────────────────

function shell({ preheader = '', body = '', appUrl = '' }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>MedRank CBT</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    @media only screen and (max-width:600px){
      .email-container{width:100%!important;margin:auto!important}
      .stack-column,.stack-column-center{display:block!important;width:100%!important;max-width:100%!important;direction:ltr!important}
      .card-padding{padding:24px 20px!important}
      .hide-mobile{display:none!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bodyBg};font-family:${FONT};-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:${BRAND.bodyBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${BRAND.bodyBg};">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" class="email-container" width="100%" cellpadding="0"
               cellspacing="0" border="0" style="max-width:560px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <a href="${appUrl}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:${BRAND.dark};letter-spacing:-0.5px;font-family:${FONT};">
                  MedRank&nbsp;<span style="color:${BRAND.primary};">CBT</span>
                </span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BRAND.cardBg};border-radius:16px;border:1px solid ${BRAND.border};
                        overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.07);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.textLight};font-family:${FONT};line-height:1.6;">
                &copy; ${YEAR} MedRank CBT &mdash; NEET PG &bull; INI-CET &bull; FMGE Preparation
              </p>
              <p style="margin:0 0 6px;font-size:11px;color:${BRAND.textFooter};font-family:${FONT};">
                ${ADDRESS}
              </p>
              <p style="margin:0;font-size:11px;color:${BRAND.textFooter};font-family:${FONT};">
                <a href="mailto:${SUPPORT}" style="color:${BRAND.textLight};text-decoration:none;">${SUPPORT}</a>
                &nbsp;&bull;&nbsp;
                <a href="${appUrl}/unsubscribe" style="color:${BRAND.textLight};text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Core sender (Maileroo HTTP API v2) ────────────────────────────────────────

async function sendEmail({ to, toName, subject, html, text, headers = {} }) {
  const res = await fetch('https://smtp.maileroo.com/api/v2/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MAILEROO_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from: {
        address:      process.env.MAIL_FROM || 'noreply@a6d7e904fe371be7.maileroo.org',
        display_name: 'MedRank CBT',
      },
      to: [{ address: to, display_name: toName || '' }],
      subject,
      html,
      plain: text,
      headers: {
        'List-Unsubscribe':      `<mailto:${SUPPORT}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID':       crypto.randomUUID(),
        'X-Mailer':              'MedRank-CBT-Mailer/2.0',
        ...headers,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Maileroo API error ${res.status}: ${errText}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME EMAIL
// ─────────────────────────────────────────────────────────────────────────────

async function sendWelcomeEmail({ name, email, targetExam }) {
  const examLabel = EXAM_LABELS[targetExam] || targetExam;
  const firstName = getFirstName(name);
  const appUrl    = process.env.FRONTEND_URL || 'https://medrankcbt.com';

  // ── Plain text ──────────────────────────────────────────────────────────────
  const textBody = `
Welcome to MedRank CBT, Dr. ${firstName}!

Your account is confirmed and your ${examLabel} preparation starts today.

──────────────────────────────────────
WHAT YOU GET
──────────────────────────────────────

1. Full-length mock tests
   Timed ${examLabel} papers matching the actual question distribution
   and marking scheme — as close to exam day as it gets.

2. Detailed performance analysis
   Subject-wise accuracy, time-per-question breakdown, weak-area
   mapping, and a focused revision plan after every test.

3. All India Rank prediction
   Your projected AIR calibrated against NEET PG 2025 data,
   updated after every test you complete.

──────────────────────────────────────
START NOW
──────────────────────────────────────

Start your first test: ${appUrl}/tests

Your target exam is set to ${examLabel}. You can change it any time
from Profile > Settings.

Questions? Reply to this email — our team reads every message.

Join our Telegram for exam updates: ${TELEGRAM}

© ${YEAR} MedRank CBT
${ADDRESS}
  `.trim();

  // ── HTML ────────────────────────────────────────────────────────────────────
  const cardBody = `
    <!-- Header banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);
                    padding:32px 40px 28px;" class="card-padding">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);
                     letter-spacing:0.12em;text-transform:uppercase;font-family:${FONT};">
            Account confirmed
          </p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;
                      line-height:1.25;font-family:${FONT};">
            Welcome, Dr. ${firstName}. &#x1F44B;
          </h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.82);font-family:${FONT};line-height:1.5;">
            Your <strong style="color:#ffffff;">${examLabel}</strong> preparation starts today.
          </p>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 40px 8px;" class="card-padding">
          <p style="margin:0 0 28px;font-size:15px;color:${BRAND.textBody};line-height:1.75;font-family:${FONT};">
            Dear Dr. ${firstName},<br/><br/>
            Your MedRank CBT account is active. We built this platform exclusively
            for MBBS graduates — every question, analysis, and rank estimate is
            calibrated to the real <strong>${examLabel}</strong> exam pattern.
          </p>

          <!-- Section label -->
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:${BRAND.primary};
                     letter-spacing:0.1em;text-transform:uppercase;font-family:${FONT};">
            What&rsquo;s included
          </p>

          <!-- Feature 1 -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 border="0" style="margin-bottom:20px;">
            <tr>
              <td width="44" valign="top">
                <div style="width:40px;height:40px;background:${BRAND.accentBg};border-radius:10px;
                             text-align:center;line-height:40px;font-size:20px;">&#x1F4DD;</div>
              </td>
              <td valign="top" style="padding-left:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${BRAND.dark};font-family:${FONT};">
                  Full-length mock tests
                </p>
                <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;font-family:${FONT};">
                  Timed ${examLabel} papers across all subject sections, matching
                  the actual question distribution and marking scheme.
                </p>
              </td>
            </tr>
          </table>

          <!-- Feature 2 -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 border="0" style="margin-bottom:20px;">
            <tr>
              <td width="44" valign="top">
                <div style="width:40px;height:40px;background:${BRAND.accentBg};border-radius:10px;
                             text-align:center;line-height:40px;font-size:20px;">&#x1F4CA;</div>
              </td>
              <td valign="top" style="padding-left:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${BRAND.dark};font-family:${FONT};">
                  Detailed performance analysis
                </p>
                <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;font-family:${FONT};">
                  Subject-wise accuracy, time-per-question breakdown, weak-area
                  mapping, and a focused revision plan — generated after every test.
                </p>
              </td>
            </tr>
          </table>

          <!-- Feature 3 -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 border="0" style="margin-bottom:32px;">
            <tr>
              <td width="44" valign="top">
                <div style="width:40px;height:40px;background:${BRAND.accentBg};border-radius:10px;
                             text-align:center;line-height:40px;font-size:20px;">&#x1F3AF;</div>
              </td>
              <td valign="top" style="padding-left:16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${BRAND.dark};font-family:${FONT};">
                  All India Rank prediction
                </p>
                <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;font-family:${FONT};">
                  Your projected AIR calibrated against NEET PG 2025 historical
                  data, updated after every test you complete.
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                 style="margin:0 auto 32px;">
            <tr>
              <td align="center" style="border-radius:10px;background:${BRAND.primary};">
                <a href="${appUrl}/tests"
                   style="display:inline-block;background:${BRAND.primary};color:#ffffff;
                           font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;
                           text-decoration:none;letter-spacing:0.01em;font-family:${FONT};">
                  Start Your First Test &rarr;
                </a>
              </td>
            </tr>
          </table>

          <!-- Divider -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-top:1px solid ${BRAND.border};padding-top:24px;padding-bottom:28px;">

                <!-- Settings note -->
                <p style="margin:0 0 12px;font-size:13px;color:${BRAND.textMuted};
                           line-height:1.6;font-family:${FONT};">
                  &#x2699;&#xFE0F;&nbsp; You are registered for
                  <strong style="color:${BRAND.primary};">${examLabel}</strong>.
                  Change your target exam any time from
                  <strong style="color:${BRAND.dark};">Profile &rsaquo; Settings</strong>.
                </p>

                <!-- Support -->
                <p style="margin:0 0 12px;font-size:13px;color:${BRAND.textMuted};
                           line-height:1.6;font-family:${FONT};">
                  &#x2709;&#xFE0F;&nbsp; Questions? Reply to this email or write to
                  <a href="mailto:${SUPPORT}"
                     style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${SUPPORT}</a>
                  — our team reads every message.
                </p>

                <!-- Telegram -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:#f0f4ff;border-radius:10px;padding:14px 18px;">
                      <p style="margin:0;font-size:13px;color:${BRAND.dark};
                                 line-height:1.6;font-family:${FONT};">
                        &#x1F4E2;&nbsp; <strong>Stay ahead of the curve.</strong>
                        Join our Telegram channel for instant updates on new tests and exam news:
                        <a href="${TELEGRAM}"
                           style="color:#0088cc;text-decoration:none;font-weight:700;">
                          t.me/medrankcbt
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  `;

  const htmlBody = shell({
    preheader: `Welcome Dr. ${firstName} — your ${examLabel} prep starts now. Attempt your first mock test today.`,
    body:      cardBody,
    appUrl,
  });

  try {
    await sendEmail({
      to:      email,
      toName:  `Dr. ${firstName}`,
      subject: `Welcome to MedRank CBT, Dr. ${firstName} 🎓`,
      html:    htmlBody,
      text:    textBody,
    });
    console.log(`[email] Welcome mail delivered → ${email}`);
  } catch (err) {
    console.error(`[email] Welcome mail FAILED for ${email}:`, err.message);
    // Non-critical — don't throw; registration should still succeed
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PASSWORD RESET EMAIL
// ─────────────────────────────────────────────────────────────────────────────

async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const firstName = getFirstName(name);
  const appUrl    = process.env.FRONTEND_URL || 'https://medrankcbt.com';

  // ── Plain text ──────────────────────────────────────────────────────────────
  const textBody = `
Password Reset Request — MedRank CBT

Hello Dr. ${firstName},

We received a request to reset the password for your MedRank CBT account
associated with this email address.

Reset your password here (expires in 15 minutes):
${resetUrl}

If the link above doesn't work, copy and paste it into your browser.

──────────────────────────────────────
DIDN'T REQUEST THIS?
──────────────────────────────────────

If you did not request a password reset, please ignore this email.
Your password will not be changed and your account remains secure.

If you are concerned about unauthorised access, contact us at:
${SUPPORT}

For security, never share this link with anyone — including MedRank support.

© ${YEAR} MedRank CBT
${ADDRESS}
  `.trim();

  // ── HTML ────────────────────────────────────────────────────────────────────
  const cardBody = `
    <!-- Header banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:${BRAND.dark};padding:32px 40px 28px;" class="card-padding">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);
                     letter-spacing:0.12em;text-transform:uppercase;font-family:${FONT};">
            Security notice
          </p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;
                      line-height:1.25;font-family:${FONT};">
            Password Reset Request
          </h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);
                     font-family:${FONT};line-height:1.5;">
            We received a request to reset your MedRank CBT password.
          </p>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 40px 28px;" class="card-padding">

          <p style="margin:0 0 8px;font-size:15px;color:${BRAND.textBody};
                     line-height:1.75;font-family:${FONT};">
            Hello Dr. ${firstName},
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:${BRAND.textBody};
                     line-height:1.75;font-family:${FONT};">
            Someone requested a password reset for the MedRank CBT account
            linked to this email address. If this was you, click the button
            below to set a new password.
          </p>

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                 style="margin:0 auto 28px;">
            <tr>
              <td align="center" style="border-radius:10px;background:${BRAND.primary};">
                <a href="${resetUrl}"
                   style="display:inline-block;background:${BRAND.primary};color:#ffffff;
                           font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;
                           text-decoration:none;letter-spacing:0.01em;font-family:${FONT};">
                  Reset My Password &rarr;
                </a>
              </td>
            </tr>
          </table>

          <!-- Expiry warning -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 border="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:${BRAND.warningBg};border:1px solid ${BRAND.warningBorder};
                          border-radius:10px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:${BRAND.warningText};
                           line-height:1.6;font-family:${FONT};">
                  &#x23F1;&nbsp; <strong>This link expires in 15 minutes.</strong>
                  If it has expired, request a new one from the
                  <a href="${appUrl}/forgot-password"
                     style="color:${BRAND.warningText};font-weight:700;">login page</a>.
                </p>
              </td>
            </tr>
          </table>

          <!-- Fallback URL -->
          <p style="margin:0 0 6px;font-size:13px;color:${BRAND.textMuted};
                     line-height:1.5;font-family:${FONT};">
            If the button above doesn&rsquo;t work, copy and paste this URL into your browser:
          </p>
          <p style="margin:0 0 28px;font-size:12px;color:${BRAND.primary};
                     word-break:break-all;line-height:1.6;font-family:${FONT};">
            ${resetUrl}
          </p>

          <!-- Divider -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-top:1px solid ${BRAND.border};padding-top:24px;">

                <!-- Didn't request box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       border="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="background:#f8fafc;border:1px solid ${BRAND.border};
                                border-radius:10px;padding:16px 18px;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;
                                 color:${BRAND.dark};font-family:${FONT};">
                        &#x1F6AB;&nbsp; Didn&rsquo;t request this?
                      </p>
                      <p style="margin:0;font-size:13px;color:${BRAND.textMuted};
                                 line-height:1.6;font-family:${FONT};">
                        You can safely ignore this email. Your password will remain
                        unchanged and your account is not at risk.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Security tip -->
                <p style="margin:0;font-size:13px;color:${BRAND.textLight};
                           line-height:1.6;font-family:${FONT};">
                  &#x1F512;&nbsp; For your security, never share this link with anyone —
                  including MedRank CBT support. If you believe your account has been
                  compromised, contact us at
                  <a href="mailto:${SUPPORT}"
                     style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${SUPPORT}</a>.
                </p>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  `;

  const htmlBody = shell({
    preheader: `Hi Dr. ${firstName}, we received a request to reset your MedRank CBT password. This link expires in 15 minutes.`,
    body:      cardBody,
    appUrl,
  });

  try {
    await sendEmail({
      to:      email,
      toName:  `Dr. ${firstName}`,
      subject: 'Reset your MedRank CBT password',
      html:    htmlBody,
      text:    textBody,
    });
    console.log(`[email] Password reset mail delivered → ${email}`);
  } catch (err) {
    console.error(`[email] Password reset mail FAILED for ${email}:`, err.message);
    throw err; // Critical — re-throw so the route can return a 500
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEST COMPLETION EMAIL  (bonus — industry standard)
// ─────────────────────────────────────────────────────────────────────────────

async function sendTestCompletionEmail({ email, name, testTitle, score, totalMarks, rank, analysisUrl }) {
  const firstName  = getFirstName(name);
  const appUrl     = process.env.FRONTEND_URL || 'https://medrankcbt.com';
  const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : null;
  const rankStr    = rank ? `#${rank.toLocaleString('en-IN')}` : 'Calculating…';
  const scoreStr   = totalMarks ? `${score} / ${totalMarks}` : `${score}`;

  const textBody = `
Test Results — MedRank CBT

Hello Dr. ${firstName},

Your results for "${testTitle}" are ready.

Score        : ${scoreStr}${percentage !== null ? ` (${percentage}%)` : ''}
Predicted AIR: ${rankStr}

View your full analysis here:
${analysisUrl || appUrl + '/tests'}

Your weak areas, time breakdown, and revision plan are waiting for you.

Keep going — every test gets you closer.

© ${YEAR} MedRank CBT
${ADDRESS}
  `.trim();

  const pctColor = percentage === null ? BRAND.primary
    : percentage >= 70 ? '#16a34a'
    : percentage >= 50 ? '#d97706'
    : '#dc2626';

  const cardBody = `
    <!-- Header -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:linear-gradient(135deg,${BRAND.dark} 0%,#334155 100%);
                    padding:32px 40px 28px;" class="card-padding">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);
                     letter-spacing:0.12em;text-transform:uppercase;font-family:${FONT};">
            Test complete
          </p>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;
                      line-height:1.3;font-family:${FONT};">
            Your results are in, Dr. ${firstName}.
          </h1>
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65);font-family:${FONT};">
            ${testTitle}
          </p>
        </td>
      </tr>
    </table>

    <!-- Score cards -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:28px 40px 0;" class="card-padding">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="margin-bottom:28px;">
            <tr>
              <!-- Score -->
              <td width="48%" style="background:#f8fafc;border:1px solid ${BRAND.border};
                                      border-radius:12px;padding:20px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${BRAND.textMuted};
                           letter-spacing:0.1em;text-transform:uppercase;font-family:${FONT};">
                  Score
                </p>
                <p style="margin:0;font-size:28px;font-weight:800;color:${pctColor};
                           font-family:${FONT};">
                  ${scoreStr}
                </p>
                ${percentage !== null ? `<p style="margin:4px 0 0;font-size:13px;color:${BRAND.textMuted};font-family:${FONT};">${percentage}%</p>` : ''}
              </td>
              <td width="4%"></td>
              <!-- AIR -->
              <td width="48%" style="background:#f8fafc;border:1px solid ${BRAND.border};
                                      border-radius:12px;padding:20px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${BRAND.textMuted};
                           letter-spacing:0.1em;text-transform:uppercase;font-family:${FONT};">
                  Predicted AIR
                </p>
                <p style="margin:0;font-size:28px;font-weight:800;color:${BRAND.primary};
                           font-family:${FONT};">
                  ${rankStr}
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                 style="margin:0 auto 28px;">
            <tr>
              <td align="center" style="border-radius:10px;background:${BRAND.primary};">
                <a href="${analysisUrl || appUrl + '/tests'}"
                   style="display:inline-block;background:${BRAND.primary};color:#ffffff;
                           font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;
                           text-decoration:none;font-family:${FONT};">
                  View Full Analysis &rarr;
                </a>
              </td>
            </tr>
          </table>

          <!-- Motivation -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 border="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:${BRAND.accentBg};border-radius:10px;padding:16px 18px;
                          border-left:4px solid ${BRAND.primary};">
                <p style="margin:0;font-size:13px;color:${BRAND.dark};
                           line-height:1.6;font-family:${FONT};">
                  &#x1F4A1;&nbsp; Your detailed subject-wise breakdown, weak areas,
                  and personalised revision plan are ready inside your dashboard.
                  Every test you complete sharpens your rank estimate.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  `;

  const htmlBody = shell({
    preheader: `Your ${testTitle} results: ${scoreStr}${percentage !== null ? ` (${percentage}%)` : ''} | Predicted AIR: ${rankStr}`,
    body:      cardBody,
    appUrl,
  });

  try {
    await sendEmail({
      to:      email,
      toName:  `Dr. ${firstName}`,
      subject: `Your ${testTitle} results are ready — MedRank CBT`,
      html:    htmlBody,
      text:    textBody,
    });
    console.log(`[email] Test completion mail delivered → ${email}`);
  } catch (err) {
    console.error(`[email] Test completion mail FAILED for ${email}:`, err.message);
    // Non-critical — don't throw
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTestCompletionEmail,
};