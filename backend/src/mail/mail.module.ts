import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { resolveMailTemplatesDir } from './mail-template.util';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('APP_SMTP_HOST', 'localhost'),
          port: config.get<number>('APP_SMTP_PORT', 587),
          secure: config.get<string>('APP_SMTP_SECURE', 'false') === 'true',
          auth: {
            user: config.get<string>('APP_SMTP_USER'),
            pass: config.get<string>('APP_SMTP_PASS'),
          },
        },
        defaults: {
          from: config.get<string>('APP_SMTP_FROM', 'Workspace <no-reply@workspace.local>'),
        },
        template: {
          dir: resolveMailTemplatesDir(__dirname),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
