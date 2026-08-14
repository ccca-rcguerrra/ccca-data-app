import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ModelModule } from '../model/model.module';
import { MailModule } from '../mail/mail.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
@Module({
  imports: [
    ModelModule,
    MailModule,
    PassportModule,
    EventEmitterModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController
  ],
  providers: [
    LocalStrategy,
    JwtStrategy,
    AuthService,
  ],
  exports: [
    AuthService
  ],
})
export class AuthModule { }
