import {
  WebSocketGateway,
  WebSocketServer,
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

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN ?? '*',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  readonly server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly websocketService: WebsocketService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server): void {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
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

      this.logger.log(`Client connected: ${client.id} (user ${user.sub})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${client.id} — ${err.message}`);
      client.emit('exception', { message: err.message });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
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
