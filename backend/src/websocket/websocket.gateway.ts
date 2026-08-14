import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WebsocketService } from './websocket.service';
import { RedisService } from '../shared/redis/redis.service';
import { REDIS_KEYS } from '../shared/redis/redis.keys';
import { UsersService } from '../users/services/users.service';

@WebSocketGateway({
  cors: {
    origin: process.env.APP_CORS_ORIGIN ?? '*',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  readonly server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly websocketService: WebsocketService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(server: Server): void {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  private getAliveSocketIdsForUser(userId: number): string[] {
    const aliveSocketIds: string[] = [];

    for (const [socketId, socket] of this.server.sockets.sockets) {
      const sub = socket.data?.user?.sub;
      if (sub == null) continue;
      if (Number(sub) !== userId) continue;

      aliveSocketIds.push(socketId);
    }

    return aliveSocketIds;
  }

  private async syncUserConnections(userId: number): Promise<void> {
    const userConnectionsKey = REDIS_KEYS.online.userConnections(userId);
    const aliveSocketIds = this.getAliveSocketIdsForUser(userId);
    const storedSocketIds =
      await this.redisService.smembers(userConnectionsKey);
    const deadSocketIds = storedSocketIds.filter(
      (socketId) => !aliveSocketIds.includes(socketId),
    );

    if (deadSocketIds.length > 0) {
      await this.redisService.srem(userConnectionsKey, ...deadSocketIds);
    }

    const missingSocketIds = aliveSocketIds.filter(
      (socketId) => !storedSocketIds.includes(socketId),
    );
    if (missingSocketIds.length > 0) {
      await this.redisService.sadd(userConnectionsKey, ...missingSocketIds);
    }

    const currentSocketIds =
      await this.redisService.smembers(userConnectionsKey);
    if (currentSocketIds.length === 0) {
      await this.redisService.del(userConnectionsKey);
    }
  }

  private async broadcastOnlineUsers(): Promise<void> {
    const onlineUsers = await this.usersService.findOnline();
    this.websocketService.emitToAll('user:presence', onlineUsers);
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const raw =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization;

      if (!raw) throw new Error('Token not provided');

      const token = (raw as string).replace(/^Bearer\s+/i, '').trim();
      const user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data = { user };
      client.join(`user:${user.sub}`);

      const userId = Number(user.sub);
      if (Number.isNaN(userId)) {
        throw new Error('Invalid user id in token');
      }

      try {
        await this.syncUserConnections(userId);
      } catch (redisErr) {
        this.logger.warn(
          `Failed to sync connections for user ${userId}: ${redisErr.message}`,
        );
      }

      await this.broadcastOnlineUsers();

      this.logger.log(`Client connected: ${client.id} (user ${user.sub})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${client.id} — ${err.message}`);
      client.emit('exception', { message: err.message });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const rawSub = client.data?.user?.sub;
    if (rawSub != null) {
      const userId = Number(rawSub);
      if (!Number.isNaN(userId)) {
        await this.syncUserConnections(userId);
      }
      await this.broadcastOnlineUsers();
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe:room')
  handleSubscribeRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { room: string },
  ): void {
    if (!payload?.room) return;
    client.join(payload.room);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('unsubscribe:room')
  handleUnsubscribeRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { room: string },
  ): void {
    if (!payload?.room) return;
    client.leave(payload.room);
  }
}
