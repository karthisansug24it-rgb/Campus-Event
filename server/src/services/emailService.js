const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpFrom = process.env.SMTP_FROM || 'FXEC Campus Events <no-reply@francisxavier.ac.in>';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

let transporter = null;
const isConfigured = Boolean(smtpUser && smtpPass);

if (isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } catch (err) {
    console.warn('[EmailService Warning]: Failed to initialize SMTP transporter:', err.message);
  }
}

/**
 * Builds responsive, mobile-friendly HTML email template.
 */
function buildHtmlTemplate({ title, message, actionUrl, actionText = 'View in Campus Events' }) {
  const fullUrl = actionUrl && actionUrl.startsWith('http') ? actionUrl : `${clientUrl}${actionUrl || '/events'}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Georgia', serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
    .card { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 24px 32px; color: #FFFFFF; text-align: left; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em; }
    .body { padding: 32px; }
    .title { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; white-space: pre-line; }
    .btn-container { text-align: left; margin: 28px 0; }
    .btn { display: inline-block; background-color: #2563EB; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 13px; letter-spacing: -0.01em; }
    .footer { padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: left; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p>Francis Xavier Engineering College</p>
      <h1>Campus Event Management System</h1>
    </div>
    <div class="body">
      <h2 class="title">${title}</h2>
      <p class="message">${message}</p>
      <div class="btn-container">
        <a href="${fullUrl}" class="btn">${actionText} &rarr;</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">This is an automated notification regarding your verified FXEC student account.<br>Francis Xavier Engineering College (Autonomous), Tirunelveli.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends an email notification to a student.
 * If SMTP is unconfigured, logs a simulation message gracefully without throwing errors.
 */
async function sendEmailNotification(toEmail, { title, message, actionUrl, actionText }) {
  if (!toEmail) return { success: false, reason: 'No recipient email provided' };

  const fullUrl = actionUrl && actionUrl.startsWith('http') ? actionUrl : `${clientUrl}${actionUrl || '/events'}`;
  const plainText = `${title}\n\n${message}\n\nView details: ${fullUrl}\n\n---\nFrancis Xavier Engineering College - Campus Event Management System`;

  if (!isConfigured || !transporter) {
    console.log(`[EmailService Info] SMTP not configured. Simulated email to ${toEmail}: "${title}"`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: title,
      text: plainText,
      html: buildHtmlTemplate({ title, message, actionUrl, actionText })
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService Error] Failed to send email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  isConfigured: () => isConfigured,
  sendEmailNotification
};
