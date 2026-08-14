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
import { SemaspaPaginationQueryDto } from '../shared/semaspa-pagination.dto';
import {
  GetPeopleResponseDto,
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
