import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromPhone = process.env.TWILIO_PHONE_NUMBER || '';

if (!accountSid || !authToken || !fromPhone) {
  console.warn('Twilio credentials are not fully set in environment variables.');
}

const client = twilio(accountSid, authToken);

/**
 * Send an SMS message using Twilio
 * @param to - recipient phone number in E.164 format
 * @param body - message body
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!accountSid || !authToken || !fromPhone) {
    throw new Error('Twilio credentials are not configured.');
  }
  try {
    await client.messages.create({
      body,
      from: fromPhone,
      to,
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}
