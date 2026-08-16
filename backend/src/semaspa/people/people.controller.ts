import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PeopleService } from './services/people.service';
import { GetPeopleQueryDto } from './dto/get-people-query.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { PersonParticipationResponseDto } from './dto/person-participation-response.dto';
import { SemaspaPaginationQueryDto } from '../shared/semaspa-pagination.dto';
import {
  GetPeopleResponseDto,
  GetPersonLinkedAutefsResponseDto,
  GetPersonLinkedForestGuidesResponseDto,
  GetPersonRolesResponseDto,
} from '../shared/paginated-responses.dto';

@ApiTags('semaspa-people')
@Controller('api/semaspa/people')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  @ApiOperation({ summary: 'List people with pagination and search' })
  @ApiOkResponse({ type: GetPeopleResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(@Query() query: GetPeopleQueryDto): Promise<GetPeopleResponseDto> {
    return this.peopleService.findAll(query);
  }

  @Get(':id/participation')
  @ApiOperation({
    summary: 'Count distinct AUTEFs and GFs linked to a person, by role',
  })
  @ApiOkResponse({ type: PersonParticipationResponseDto })
  @ApiNotFoundResponse({ description: 'Person not found' })
  findParticipation(
    @Param('id') id: string,
  ): Promise<PersonParticipationResponseDto> {
    return this.peopleService.findParticipation(id);
  }

  @Get(':id/autefs')
  @ApiOperation({ summary: 'List AUTEFs linked to a person' })
  @ApiOkResponse({ type: GetPersonLinkedAutefsResponseDto })
  @ApiNotFoundResponse({ description: 'Person not found' })
  findAutefs(
    @Param('id') id: string,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonLinkedAutefsResponseDto> {
    return this.peopleService.findAutefs(id, query);
  }

  @Get(':id/forest-guides')
  @ApiOperation({ summary: 'List forest guides linked to a person' })
  @ApiOkResponse({ type: GetPersonLinkedForestGuidesResponseDto })
  @ApiNotFoundResponse({ description: 'Person not found' })
  findForestGuides(
    @Param('id') id: string,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonLinkedForestGuidesResponseDto> {
    return this.peopleService.findForestGuides(id, query);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'List roles for a person' })
  @ApiOkResponse({ type: GetPersonRolesResponseDto })
  @ApiNotFoundResponse({ description: 'Person not found' })
  findRoles(
    @Param('id') id: string,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonRolesResponseDto> {
    return this.peopleService.findRoles(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person by ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4e5f6' })
  @ApiOkResponse({ type: PersonResponseDto })
  @ApiNotFoundResponse({ description: 'Person not found' })
  findOne(@Param('id') id: string): Promise<PersonResponseDto> {
    return this.peopleService.findOne(id);
  }
}
