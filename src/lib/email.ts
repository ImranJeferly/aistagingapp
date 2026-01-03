import { Resend } from 'resend';
import { VerificationEmail } from '@/emails/VerificationEmail';
import { ResetPasswordEmail } from '@/emails/ResetPasswordEmail';
import { AbuseDetectionEmail } from '@/emails/AbuseDetectionEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (to: string, code: string, name?: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('=================================================');
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[MOCK EMAIL] Code: ${code}`);
    console.log(`[MOCK EMAIL] Name: ${name}`);
    console.log('=================================================');
    return;
  }

  try {
    await resend.emails.send({
      from: 'AI Staging App <onboarding@aistagingapp.com>',
      to,
      subject: 'Your Verification Code',
      react: VerificationEmail({ code, name }),
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetEmail = async (to: string, resetLink: string, name?: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('=================================================');
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[MOCK EMAIL] Link: ${resetLink}`);
    console.log(`[MOCK EMAIL] Name: ${name}`);
    console.log('=================================================');
    return;
  }

  try {
    await resend.emails.send({
      from: 'AI Staging App <onboarding@aistagingapp.com>',
      to,
      subject: 'Reset Your Password',
      react: ResetPasswordEmail({ resetLink, name }),
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendAbuseDetectionEmail = async (to: string, name?: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('=================================================');
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[MOCK EMAIL] Subject: Account Restricted`);
    console.log(`[MOCK EMAIL] Name: ${name}`);
    console.log('=================================================');
    return;
  }

  try {
    await resend.emails.send({
      from: 'AI Staging App <onboarding@aistagingapp.com>',
      to,
      subject: 'Action Required: Account Restricted',
      react: AbuseDetectionEmail({ name }),
    });
  } catch (error) {
    console.error('Error sending abuse detection email:', error);
    // Don't throw here to prevent blocking the API response
  }
};
