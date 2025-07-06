import nodemailer from 'nodemailer';

const GMAIL_EMAIL = process.env.GMAIL_EMAIL || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
  console.warn('Gmail email or app password is not set in environment variables.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an email using Nodemailer
 * @param to - recipient email address
 * @param subject - email subject
 * @param text - plain text email body
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials are not configured.');
  }
  try {
    await transporter.sendMail({
      from: GMAIL_EMAIL,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
