import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendResetPasswordEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export interface SendMentionEmailParams {
  to: string;
  name: string;
  actorName: string;
  preview: string;
  resourceId?: number;
  resourceUrl?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendResetPasswordEmail(
    params: SendResetPasswordEmailParams,
  ): Promise<void> {
    const { to, name, resetUrl } = params;

    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Reset your password',
        template: 'reset-password',
        context: {
          firstName: name.split(' ')[0],
          resetUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${to}`,
        error,
      );
      throw error;
    }
  }

  async sendMentionEmail(params: SendMentionEmailParams): Promise<void> {
    const { to, name, actorName, preview, resourceId, resourceUrl } = params;
    const frontendUrl =
      process.env.APP_FRONTEND_URL ?? 'http://localhost:4200';
    const hasResource = resourceUrl != null || resourceId != null;
    const url = resourceUrl ?? frontendUrl;

    try {
      await this.mailerService.sendMail({
        to,
        subject: `${actorName} mencionou você em um comentário`,
        template: 'comment-mention',
        context: {
          firstName: name.split(' ')[0],
          actorName,
          preview,
          resourceUrl: url,
          hasResource,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send mention email to ${to}`, error);
      throw error;
    }
  }
}
