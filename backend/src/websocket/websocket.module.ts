import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { CommentListener } from './listeners/comment.listener';
import { NotificationListener } from './listeners/notification.listener';
import { RedisModule } from '../shared/redis/redis.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    RedisModule,
    UsersModule,
    // AuthModule não exporta JwtModule — registramos aqui com a mesma config
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get('jwt.expiresIn') ?? '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    WebsocketGateway,
    WebsocketService,
    WsJwtGuard,
    CommentListener,
    NotificationListener,
  ],
  exports: [WebsocketService],
})
export class WebsocketModule {}
