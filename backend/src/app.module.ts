import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import jwtConfig from './config/setup/jwt.config';
import geeConfig from './config/setup/gee.config';
import appConfig from './config/app-config.config';
import { RedisModule } from './shared/redis/redis.module';
import { GcsModule } from './shared/gcs/gcs.module';
import { QueuesModule } from './queues/queues.module';

import { ModelModule } from './model/model.module';

import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { AuthModule } from './auth/auth.module';
import { TerritoriesModule } from './territories/territories.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GeeModule } from './gee/gee.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AppConfigModule } from './config/app-config.module';
import { SemaspaModule } from './semaspa/semaspa.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, geeConfig, appConfig],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    RedisModule,
    GcsModule,
    QueuesModule,
    ModelModule,
    GeeModule,
    UsersModule,
    TeamsModule,
    AuthModule,
    TerritoriesModule,
    CommentsModule,
    NotificationsModule,
    WebsocketModule,
    AppConfigModule,
    SemaspaModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}
