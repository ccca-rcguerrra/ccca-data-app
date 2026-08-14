import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '../interfaces/authenticated-socket.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();

    // Já autenticado no handleConnection — reutiliza sem re-validar
    if (client.data?.user) return true;

    try {
      const raw =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization;

      client.data = { user: await this.verifyToken(raw) };
      return true;
    } catch (err) {
      throw new WsException(err.message ?? 'Unauthorized');
    }
  }

  async verifyToken(raw: string | undefined) {
    if (!raw) throw new WsException('Token not provided');
    const token = raw.replace(/^Bearer\s+/i, '').trim();
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.secret'),
    });
  }
}
