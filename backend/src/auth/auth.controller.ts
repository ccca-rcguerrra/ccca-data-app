import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { computePermissions } from './auth.permissions';
import { LoginDto } from './dto/login.dto';
import { AuthLoginResponseDto } from './dto/login-response.dto';
import { GetMeResponseDto } from './dto/get-me-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT token',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthLoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthLoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns the authenticated user data',
  })
  @ApiOkResponse({
    description: 'User profile returned successfully',
    type: GetMeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  async getMe(@Request() req): Promise<GetMeResponseDto> {
    const user = await this.authService.getUserEntity(req.user.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const roles = (user.userRoles ?? []).map((ur) => ur.role);
    return new GetMeResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      institution: user.institution ?? null,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
      permissions: computePermissions(roles),
      teamIds: (user.teams ?? []).map((ut) => ut.teamId),
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar redefinição de senha',
    description: 'Envia um email com link de redefinição. Sempre retorna 200, mesmo se o email não estiver cadastrado.',
  })
  @ApiOkResponse({ description: 'Email enviado (se cadastrado)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefinir senha',
    description: 'Valida o token recebido por email e atualiza a senha do usuário.',
  })
  @ApiOkResponse({ description: 'Senha redefinida com sucesso' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.password);
  }
}
