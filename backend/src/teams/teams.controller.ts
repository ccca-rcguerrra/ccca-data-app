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
import { TeamsService } from './services/teams.service';
import { GetTeamsQueryDto } from './dto/get-teams-query.dto';
import { GetTeamsResponseDto } from './dto/get-teams-response.dto';
import { GetTeamResponseDto } from './dto/get-team-response.dto';
import { Team } from '../model/entities/team.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('teams')
@Controller('api/teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TeamsController {

  constructor(private readonly teamsService: TeamsService) { }

  @Get()
  @ApiOperation({
    summary: 'List teams',
    description: 'Returns a paginated list of teams',
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search text to filter by team name (partial match)',
    example: 'Alpha',
  })
  @ApiQuery({
    name: 'users',
    required: false,
    description: 'Filter by user IDs (exact match). Can be a single ID or array of IDs',
    example: [1, 2],
  })
  @ApiOkResponse({
    description: 'Team list returned successfully',
    type: GetTeamsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  findAll(@Query() paginationDto: GetTeamsQueryDto): Promise<GetTeamsResponseDto> {
    return this.teamsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get team by ID',
    description: 'Returns a single team by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the team to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Team returned successfully',
    type: GetTeamResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Team not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<GetTeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove team',
    description: 'Removes a team from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the team to be removed',
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Team removed successfully',
  })
  @ApiNotFoundResponse({
    description: 'Team not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.remove(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create team',
    description: 'Creates a new team',
  })
  @ApiBody({
    type: CreateTeamDto,
  })
  @ApiCreatedResponse({
    description: 'Team created successfully',
    type: Team,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  create(@Body() createTeamDto: CreateTeamDto): Promise<Team> {
    return this.teamsService.createTeam(createTeamDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update team',
    description: 'Updates a team',
  })
  @ApiBody({
    type: UpdateTeamDto,
  })
  @ApiOkResponse({
    description: 'Team updated successfully',
    type: Team,
  })
  @ApiNotFoundResponse({
    description: 'Team not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid data provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTeamDto: UpdateTeamDto): Promise<Team> {
    return this.teamsService.updateTeam(id, updateTeamDto);
  }
}

