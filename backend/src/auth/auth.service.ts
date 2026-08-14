import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import { RedisService, REDIS_KEYS, REDIS_TTL } from '../shared/redis';
import { MailService } from '../mail/mail.service';
import { computePermissions } from './auth.permissions';
import { LoginDto } from './dto/login.dto';
import { AuthLoginResponseDto } from './dto/login-response.dto';
import { AuthEvents, AuthLoggedInPayload } from './auth.types';
import { User } from '../model/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
    private eventEmitter: EventEmitter2,
    private mailService: MailService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });
      if (user && (await bcrypt.compare(password, user.password))) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthLoginResponseDto> {
    const validated = await this.validateUser(loginDto.email, loginDto.password);
    if (!validated) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reutiliza getUserEntity para carregar roles e popular o cache
    const user = await this.getUserEntity(validated.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    const expires_in = 3600;

    this.eventEmitter.emit(AuthEvents.AUTH_USER_LOGGED_IN, {
      data: user,
      timestamp: new Date(),
      event: AuthEvents.AUTH_USER_LOGGED_IN,
    } as AuthLoggedInPayload);

    return new AuthLoginResponseDto({
      access_token,
      token_type: 'Bearer',
      expires_in,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        status: user.status,
        institution: user.institution ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: (user.userRoles ?? []).map((ur) => ur.role),
        permissions: computePermissions((user.userRoles ?? []).map((ur) => ur.role)),
        teamIds: (user.teams ?? []).map((ut) => ut.teamId),
      },
    });
  }


  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Não revela se o email existe ou não
    if (!user) return;

    const token = randomUUID();
    const cacheKey = REDIS_KEYS.auth.resetToken(token);
    await this.redisService.set(cacheKey, user.id, REDIS_TTL.RESET_TOKEN);

    const frontendUrl = process.env.APP_FRONTEND_URL ?? 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.mailService.sendResetPasswordEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const cacheKey = REDIS_KEYS.auth.resetToken(token);
    const userId = await this.redisService.get<number>(cacheKey);

    if (!userId) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Token de uso único — remove após uso
    await this.redisService.del(cacheKey);

    // Invalida cache do usuário para forçar nova leitura
    await this.redisService.del(REDIS_KEYS.auth.user(userId));
  }

  async getUserEntity(userId: number): Promise<User | null> {
    const cacheKey = REDIS_KEYS.auth.user(userId);

    // Try to get user from cache first
    const cachedUser = await this.redisService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, fetch from database
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'photo', 'status', 'institution', 'createdAt', 'updatedAt'],
      relations: { userRoles: true, teams: true },
    });

    if (user) {
      // Store in cache for 5 minutes (300 seconds)
      await this.redisService.set(cacheKey, user, REDIS_TTL.AUTH_USER);
    }

    return user;
  }

}
