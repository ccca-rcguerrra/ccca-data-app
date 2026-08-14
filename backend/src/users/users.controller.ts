import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './services/users.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { GetUsersResponseDto } from './dto/get-users-response.dto';
import { GetUserResponseDto } from './dto/get-user-response.dto';
import { GetOnlineUsersResponseDto } from './dto/get-online-users-response.dto';
import { User } from 'src/model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/model.enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('api/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  @Get('online')
  @ApiOperation({
    summary: 'Get online users',
    description: 'Returns the list of users currently connected via WebSocket',
  })
  @ApiOkResponse({
    description: 'Online users returned successfully',
    type: GetOnlineUsersResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findOnline(): Promise<GetOnlineUsersResponseDto> {
    return this.usersService.findOnline();
  }

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Returns a paginated list of users',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiOkResponse({
    description: 'User list returned successfully',
    type: GetUsersResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  findAll(@Query() paginationDto: GetUsersQueryDto): Promise<GetUsersResponseDto> {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a single user by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'User returned successfully',
    type: GetUserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<GetUserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove user access',
    description: 'Sets user status to blocked (soft delete). Requires ADMIN or COORDINATOR role.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to deactivate',
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'User access removed (status set to blocked)',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Create user',
    description: 'Creates a new user. Requires ADMIN or COORDINATOR role.',
  })
  @ApiBody({ type: CreateUserDto })
  create(@Req() req: any, @Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates a user. Requires ADMIN or COORDINATOR role.',
  })
  @ApiBody({ type: UpdateUserDto })
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(id, updateUserDto, req.user.id);
  }
}
