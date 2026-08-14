import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Team } from '../../model/entities/team.entity';
import { TeamTerritory } from '../../model/entities/team-territory.entity';
import { CurrentTerritoryView } from '../../model/entities/current-territory.view.entity';
import { User } from '../../model/entities/user.entity';
import { UsersTeam } from '../../model/entities/users-team.entity';
import { GetTeamsQueryDto } from '../dto/get-teams-query.dto';
import { GetTeamsResponseDto } from '../dto/get-teams-response.dto';
import { GetTeamResponseDto, TeamDto } from '../dto/get-team-response.dto';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { TerritoryDto } from '../../users/dto/territory.dto';
import { UserDto } from '../dto/user.dto';
import {
  getPrimaryTeamTerritory,
  setTeamTerritory,
} from '../utils/team-territory.helper';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamTerritory)
    private readonly teamTerritoryRepository: Repository<TeamTerritory>,
    @InjectRepository(CurrentTerritoryView)
    private readonly currentTerritoryRepository: Repository<CurrentTerritoryView>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UsersTeam)
    private readonly usersTeamRepository: Repository<UsersTeam>,
  ) { }

  async findAll(
    paginationDto: GetTeamsQueryDto,
  ): Promise<GetTeamsResponseDto> {
    const { page = 1, limit = 10, search, users } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .select([
        'team.id',
        'team.name',
        'team.createdAt',
        'team.updatedAt',
      ])
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(ut.user_id)', 'count')
            .from('workspace.user_teams', 'ut')
            .where('ut.team_id = team.id'),
        'usersCount',
      )
      .leftJoin('team.userTeams', 'userTeam')
      .addSelect([
        'userTeam.userId',
        'userTeam.teamId',
        'userTeam.createdAt',
        'userTeam.updatedAt',
      ])
      .leftJoin('userTeam.user', 'user')
      .addSelect([
        'user.id',
        'user.name',
        'user.email',
        'user.photo',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
      ])
      .leftJoin('team.teamTerritories', 'teamTerritory')
      .addSelect([
        'teamTerritory.teamId',
        'teamTerritory.territoryId',
        'teamTerritory.createdAt',
        'teamTerritory.updatedAt',
      ])
      .leftJoin('teamTerritory.territory', 'territory')
      .addSelect([
        'territory.id',
        'territory.version',
        'territory.name',
        'territory.category',
        'territory.categoryName',
        'territory.source',
        'territory.areaHa',
        'territory.enabled',
      ]);

    if (search) {
      queryBuilder.andWhere('LOWER(team.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (users && users.length > 0) {
      queryBuilder.andWhere('userTeam.userId IN (:...userIds)', {
        userIds: users,
      });
      queryBuilder.distinct(true);
    }

    queryBuilder
      .orderBy('team.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const { entities: teams, raw } = await queryBuilder.getRawAndEntities();

    const countQueryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.userTeams', 'userTeam');

    if (search) {
      countQueryBuilder.andWhere('LOWER(team.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    let total: number;
    if (users && users.length > 0) {
      countQueryBuilder.andWhere('userTeam.userId IN (:...userIds)', {
        userIds: users,
      });
      total = await countQueryBuilder
        .select('COUNT(DISTINCT team.id)', 'count')
        .getRawOne()
        .then(result => parseInt(result.count || '0', 10));
    } else {
      total = await countQueryBuilder.getCount();
    }

    const teamsWithCount = teams.map((team) => {
      const rawResult = raw.find(r => r.team_id === team.id);
      const usersCount = rawResult?.usersCount
        ? parseInt(String(rawResult.usersCount), 10)
        : 0;
      return {
        ...team,
        usersCount,
      };
    });

    const teamsWithDetails = teamsWithCount.map(team => this.mapTeamToDto(team));

    return new GetTeamsResponseDto(teamsWithDetails, page, limit, total);
  }

  async findOne(id: number): Promise<GetTeamResponseDto> {
    const queryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .select([
        'team.id',
        'team.name',
        'team.createdAt',
        'team.updatedAt',
      ])
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(DISTINCT ut.user_id)', 'count')
            .from('workspace.user_teams', 'ut')
            .where('ut.team_id = team.id'),
        'usersCount',
      )
      .leftJoin('team.userTeams', 'userTeam')
      .addSelect([
        'userTeam.userId',
        'userTeam.teamId',
        'userTeam.createdAt',
        'userTeam.updatedAt',
      ])
      .leftJoin('userTeam.user', 'user')
      .addSelect([
        'user.id',
        'user.name',
        'user.email',
        'user.photo',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
      ])
      .leftJoin('team.teamTerritories', 'teamTerritory')
      .addSelect([
        'teamTerritory.teamId',
        'teamTerritory.territoryId',
        'teamTerritory.createdAt',
        'teamTerritory.updatedAt',
      ])
      .leftJoin('teamTerritory.territory', 'territory')
      .addSelect([
        'territory.id',
        'territory.version',
        'territory.name',
        'territory.category',
        'territory.categoryName',
        'territory.source',
        'territory.areaHa',
        'territory.enabled',
      ])
      .where('team.id = :id', { id });

    const result = await queryBuilder.getRawAndEntities();
    const team = result.entities[0];
    const rawResult = result.raw[0];

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    const teamWithCount = {
      ...team,
      usersCount: rawResult ? parseInt(rawResult.usersCount || '0', 10) : 0,
    };

    const teamDto = this.mapTeamToDto(teamWithCount);
    return new GetTeamResponseDto(teamDto);
  }

  async findOneEntity(id: number): Promise<Team | null> {
    return this.teamRepository.findOne({
      where: { id },
    });
  }

  async remove(id: number): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    await this.teamRepository.remove(team);
  }

  private mapTeamToDto(team: Team & { usersCount?: number }): TeamDto {
    const users: UserDto[] = (team.userTeams || [])
      .filter(userTeam => userTeam.user)
      .map(userTeam => ({
        id: userTeam.user.id,
        name: userTeam.user.name,
        email: userTeam.user.email,
        photo: userTeam.user.photo,
        status: userTeam.user.status,
        createdAt: userTeam.user.createdAt,
        updatedAt: userTeam.user.updatedAt,
      }));

    const primaryTeamTerritory = getPrimaryTeamTerritory(team.teamTerritories);
    const territoryEntity = primaryTeamTerritory?.territory;
    const territoryId = primaryTeamTerritory?.territoryId ?? null;

    const territory: TerritoryDto | null = territoryEntity
      ? {
          id: territoryEntity.id,
          version: territoryEntity.version,
          name: territoryEntity.name,
          category: territoryEntity.category,
          categoryName: territoryEntity.categoryName || null,
          source: territoryEntity.source,
          areaHa: territoryEntity.areaHa || null,
          enabled: territoryEntity.enabled ?? true,
        }
      : null;

    return {
      id: team.id,
      name: team.name,
      territoryId,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      territory,
      users,
      usersCount: team.usersCount ?? users.length,
    };
  }

  async createTeam(createTeamDto: CreateTeamDto): Promise<Team> {
    if (createTeamDto.territoryId !== undefined && createTeamDto.territoryId !== null) {
      await this.validateTerritoryId(createTeamDto.territoryId);
    }

    const team = this.teamRepository.create({
      name: createTeamDto.name,
    });

    const savedTeam = await this.teamRepository.save(team);

    await setTeamTerritory(
      this.teamTerritoryRepository,
      savedTeam.id,
      createTeamDto.territoryId,
    );

    if (createTeamDto.userIds && createTeamDto.userIds.length > 0) {
      await this.addUsersToTeam(savedTeam.id, createTeamDto.userIds);
    }

    return savedTeam;
  }

  async updateTeam(id: number, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    if (updateTeamDto.territoryId !== undefined) {
      if (updateTeamDto.territoryId !== null) {
        await this.validateTerritoryId(updateTeamDto.territoryId);
      }

      await setTeamTerritory(
        this.teamTerritoryRepository,
        id,
        updateTeamDto.territoryId,
      );
    }

    if (updateTeamDto.name !== undefined) {
      team.name = updateTeamDto.name;
    }

    return this.teamRepository.save(team);
  }

  async addUsersToTeam(teamId: number, userIds: number[]): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    if (userIds.length === 0) {
      throw new BadRequestException('At least one user ID must be provided');
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = userIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Users with IDs [${missingIds.join(', ')}] not found`);
    }

    const existingUsersTeams = await this.usersTeamRepository.find({
      where: {
        teamId,
        userId: In(userIds),
      },
    });

    const existingUserIds = existingUsersTeams.map(ut => ut.userId);
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      throw new BadRequestException('All provided users are already in the team');
    }

    const usersTeams = newUserIds.map(userId =>
      this.usersTeamRepository.create({
        userId,
        teamId,
      }),
    );

    await this.usersTeamRepository.save(usersTeams);
  }

  async removeUsersFromTeam(teamId: number, userIds: number[]): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    if (userIds.length === 0) {
      throw new BadRequestException('At least one user ID must be provided');
    }

    await this.usersTeamRepository.delete({
      teamId,
      userId: In(userIds),
    });
  }

  private async validateTerritoryId(territoryId: number): Promise<void> {
    const territory = await this.currentTerritoryRepository.findOne({
      where: { id: territoryId },
    });

    if (!territory) {
      throw new BadRequestException(`Territory with ID ${territoryId} not found`);
    }
  }
}
