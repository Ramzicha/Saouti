import { logger } from '@/lib/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<void>;
}

export class ConsoleEmailService implements EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    logger.info(
      {
        to: options.to,
        subject: options.subject,
      },
      `[EMAIL DISPATCH] To: ${options.to} | Subject: ${options.subject}`,
    );
    // Write full link to stdout in dev for easy clicking
    process.stdout.write(
      `\n📨 ================= EMAIL SENT =================\n`,
    );
    process.stdout.write(
      `To: ${options.to}\nSubject: ${options.subject}\n\n${options.text}\n`,
    );
    process.stdout.write(
      `=================================================\n\n`,
    );
  }
}

export const emailService: EmailService = new ConsoleEmailService();
