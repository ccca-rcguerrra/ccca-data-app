import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private server: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  // ── Generic emit ───────────────────────────────────────────────────────────
  emitToUser(userId: number, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
  }

  emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }
}
