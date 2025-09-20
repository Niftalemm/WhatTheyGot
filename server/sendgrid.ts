// SendGrid integration for email verification
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set - email verification disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`Would send email to ${params.to}: ${params.subject}`);
      return true; // Mock success when no API key
    }
    
    const mailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) mailData.text = params.text;
    if (params.html) mailData.html = params.html;
    
    await mailService.send(mailData);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@campus-menu.com';
  
  return sendEmail({
    to: email,
    from: fromEmail,
    subject: 'Verify your Campus Menu account',
    text: `Your verification code is: ${code}`,
    html: `
      <h2>Verify your Campus Menu account</h2>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}