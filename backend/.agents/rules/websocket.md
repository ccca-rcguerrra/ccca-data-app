# WebSocket Rules

## Architecture

```
EventEmitter2 domain event
        │
        ▼
WebSocket Listener (@OnEvent)
        │
        ▼
WebsocketService.emitToUser() / emitToRoom() / emitToAll()
        │
        ▼
Socket.IO Server → connected clients
```

## Gateway Pattern

```typescript
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  cors: { origin: process.env.WS_CORS_ORIGIN ?? '*', credentials: true },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() readonly server: Server;

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    // 1. Extract JWT from handshake.auth.token or headers.authorization
    // 2. Verify JWT
    // 3. client.data = { user: payload }
    // 4. client.join(`user:${user.sub}`)
    // 5. Sync online presence in Redis
    // 6. Broadcast updated online users
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    // 1. Sync Redis connections (remove dead socket IDs)
    // 2. Broadcast updated online users
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe:room')
  handleSubscribeRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() { room }: { room: string }) {
    if (!room) return;
    client.join(room);
  }
}
```

## Event Definition Pattern

```typescript
// src/websocket/events/<domain>.events.ts

export const DOMAIN_EVENTS = {
  CREATED: 'domain:created',
  UPDATED: 'domain:updated',
} as const;

export class DomainCreatedEvent {
  id: number;
  userId: number;
}
```

## Listener Pattern (WebSocket Bridge)

```typescript
// src/websocket/listeners/<domain>.listener.ts

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS, DomainCreatedEvent } from '../events/domain.events';
import { WebsocketService } from '../websocket.service';

@Injectable()
export class DomainListener {
  constructor(private readonly wsService: WebsocketService) {}

  @OnEvent(DOMAIN_EVENTS.CREATED)
  onDomainCreated(event: DomainCreatedEvent) {
    this.wsService.emitToUser(event.userId, DOMAIN_EVENTS.CREATED, event);
  }
}
```

## WebsocketService Methods

| Method | Target |
|--------|--------|
| `emitToUser(userId, event, payload)` | Single user's room `user:<id>` |
| `emitToRoom(room, event, payload)` | Named room (e.g. `comments:alert:123`) |
| `emitToAll(event, payload)` | All connected clients |

## Guard

```typescript
// WsJwtGuard: validates JWT on @SubscribeMessage handlers
// Reuses client.data.user set during handleConnection
// If missing, verifies token from handshake.auth/headers
@UseGuards(WsJwtGuard)
@SubscribeMessage('my-event')
handleMyEvent() { ... }
```

## Rules

- **Gateway handles connection/auth only** — business logic goes in listeners
- **Listeners bridge EventEmitter2 → Socket.IO** — never put business logic in listeners
- **WS events use colon-separated names** — `comment:created`, `notification:created`, `user:presence`
- **Client messages use colon-separated names** — `subscribe:room`, `subscribe:comments`
- **Auth via `handshake.auth.token`** — same JWT as HTTP
- **Presence tracking in Redis** — `REDIS_KEYS.online.userConnections(userId)` set
- **Register listeners in `websocket.module.ts` providers**
