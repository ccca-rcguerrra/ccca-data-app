import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';
import { RedisModule } from '../shared/redis/redis.module';

import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [ModelModule, RedisModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
