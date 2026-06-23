const nodemailer = require('nodemailer');
const crypto = require('crypto');


// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,     // ← was 587
  secure: true,  // ← was false
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

transporter.verify((error) => {
  if (error) {
    console.error('[email] SMTP transporter verification FAILED:', error.message);
  } else {
    console.log('[email] SMTP transporter ready');
  }
});

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

// ── Welcome Email ─────────────────────────────────────────────────────────────

/**
 * Sends a welcome email after successful registration.
 *
 * @param {{ name: string, email: string, targetExam: string }} param0
 */
async function sendWelcomeEmail({ name, email, targetExam }) {
  const examLabel = EXAM_LABELS[targetExam] || targetExam;
  const firstName = getFirstName(name);
  const appUrl    = process.env.FRONTEND_URL || 'https://medranktest.com';
  const year      = new Date().getFullYear();

  // Unique message ID improves deliverability
  const messageId = `<welcome-${crypto.randomBytes(8).toString('hex')}@medrankcbt.com>`;

  // ── Plain-text version (REQUIRED — spam filters penalise HTML-only mail) ──
  const textBody = `
Dear Dr. ${firstName},

Your MedRank CBT account is active and ready to use.

Target exam: ${examLabel}

We built MedRank CBT specifically for MBBS graduates preparing for
postgraduate entrance exams. Every test, analysis, and rank prediction
is calibrated to the real exam pattern — so the time you invest here
translates directly to your performance on exam day.

Here is what you can do right now:

  1. Attempt a full-length mock test
     Timed ${examLabel} papers across all subject sections, matching
     the actual question distribution and marking scheme.

  2. Review your performance analysis
     Subject-wise accuracy, time-per-question data, weak-area
     identification, and a focused revision plan generated after
     each test.

  3. Check your predicted All India Rank
     AIR estimates calibrated against NEET PG 2025 data, updated
     after every test you complete.

Start your first test:
${appUrl}/tests

──────────────────────────────────────────
Target exam can be changed at any time from Profile > Settings.
Questions? Reply to this email — our team reads every message.

(c) ${year} MedRank CBT
B-42, Sector 62, Noida, Uttar Pradesh 201301, India
  `.trim();

  // ── HTML version ──────────────────────────────────────────────────────────
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Welcome to MedRank CBT</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:540px;">

          <!-- ── Wordmark ── -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">
                MedRank <span style="color:#4f46e5;">CBT</span>
              </span>
            </td>
          </tr>

          <!-- ── Card ── -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;
                        overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <!-- Accent header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#4f46e5;padding:28px 32px 24px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:600;
                               color:rgba(255,255,255,0.7);letter-spacing:0.08em;
                               text-transform:uppercase;">
                      Account confirmed
                    </p>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                      Welcome, Dr. ${firstName}.
                    </h1>
                    <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">
                      Your ${examLabel} preparation starts today.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 32px 8px;">
                    <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
                      Dear Dr. ${firstName}, your account is active. MedRank CBT is built
                      exclusively for MBBS graduates — every question, analysis, and rank
                      estimate is calibrated to the real ${examLabel} pattern.
                    </p>

                    <!-- Feature 1 -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           border="0" style="margin-bottom:18px;">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width:32px;height:32px;background:#eef2ff;border-radius:8px;
                                      text-align:center;line-height:32px;font-size:16px;">
                            &#x1F4DD;
                          </div>
                        </td>
                        <td valign="top" style="padding-left:14px;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1e293b;">
                            Full-length mock tests
                          </p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                            Timed ${examLabel} papers matching the actual question distribution
                            and marking scheme — as close to exam day as it gets.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 2 -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           border="0" style="margin-bottom:18px;">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width:32px;height:32px;background:#eef2ff;border-radius:8px;
                                      text-align:center;line-height:32px;font-size:16px;">
                            &#x1F4CA;
                          </div>
                        </td>
                        <td valign="top" style="padding-left:14px;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1e293b;">
                            Detailed performance analysis
                          </p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                            Subject-wise accuracy, time-per-question breakdown, weak-area
                            mapping, and a focused revision plan — generated after every test.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 3 -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           border="0" style="margin-bottom:28px;">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width:32px;height:32px;background:#eef2ff;border-radius:8px;
                                      text-align:center;line-height:32px;font-size:16px;">
                            &#x1F3AF;
                          </div>
                        </td>
                        <td valign="top" style="padding-left:14px;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1e293b;">
                            All India Rank prediction
                          </p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                            Your projected AIR, calibrated against NEET PG 2025 historical
                            data and updated after every test you complete.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           border="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${appUrl}/tests"
                             style="display:inline-block;background:#4f46e5;color:#ffffff;
                                    font-size:14px;font-weight:600;padding:12px 28px;
                                    border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
                            Start your first test
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-top:1px solid #f1f5f9;padding-top:24px;padding-bottom:24px;">
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                            You are registered for
                            <strong style="color:#4f46e5;">${examLabel}</strong>.
                            You can change your target exam at any time from
                            <strong style="color:#475569;">Profile &rsaquo; Settings</strong>.
                          </p>
                          <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
                            Questions? Reply to this email — our team reads every message.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                &copy; ${year} MedRank CBT &mdash; You received this because you created an account.
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                B-42, Sector 62, Noida, Uttar Pradesh 201301, India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  try {
    await transporter.sendMail({
      from:    `"MedRank CBT" <${process.env.GMAIL_USER}>`,
      to:      `${name} <${email}>`,           // "Full Name <email>" format improves trust
      subject: `Welcome to MedRank CBT, Dr. ${firstName}`,  // No emoji in subject — triggers spam filters
      text:    textBody,                        // Plain-text fallback (required)
      html:    htmlBody,
      headers: {
        'Message-ID':      messageId,
        'List-Unsubscribe': `<mailto:unsubscribe@medrankcbt.com?subject=unsubscribe>`, // CAN-SPAM
        'X-Mailer':        'MedRank CBT Mailer v1',
        'Precedence':      'bulk',
      },
    });
    console.log(`[email] Welcome mail delivered → ${email}`);
  } catch (err) {
    // Email failure must never block registration
    console.error(`[email] Welcome mail FAILED for ${email}:`, err.message);
  }
}

async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const firstName = getFirstName(name);

  await transporter.sendMail({
    from: `"MedRank CBT" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>

      <p>Hello Dr. ${firstName},</p>

      <p>Click the button below to reset your password:</p>

      <p>
        <a href="${resetUrl}"
           style="
             background:#4f46e5;
             color:white;
             padding:12px 20px;
             text-decoration:none;
             border-radius:6px;
           ">
           Reset Password
        </a>
      </p>

      <p>This link expires in 15 minutes.</p>

      <p>If you didn't request this, simply ignore this email.</p>
    `,
  });
}

module.exports = { sendWelcomeEmail , sendPasswordResetEmail};