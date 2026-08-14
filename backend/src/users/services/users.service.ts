import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../model/entities/user.entity';
import { UsersTeam } from '../../model/entities/users-team.entity';
import { Territory } from '../../model/entities/territory.entity';
import { Team } from '../../model/entities/team.entity';
import { UserRole as UserRoleEntity } from '../../model/entities/user-role.entity';
import { UserRole } from '../../model/model.enums';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { GetUsersResponseDto } from '../dto/get-users-response.dto';
import { GetUserResponseDto, UserDto } from '../dto/get-user-response.dto';
import { GetOnlineUsersResponseDto, OnlineUserDto } from '../dto/get-online-users-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { TeamDto } from '../dto/team.dto';
import { getPrimaryTeamTerritory } from '../../teams/utils/team-territory.helper';
import { RedisService } from '../../shared/redis/redis.service';
import { REDIS_KEYS } from '../../shared/redis/redis.keys';
import { REDIS_TTL } from '../../shared/redis/redis.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UsersTeam)
    private readonly usersTeamRepository: Repository<UsersTeam>,
    @InjectRepository(Territory)
    private readonly territoryRepository: Repository<Territory>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly redisService: RedisService,
  ) { }

  async findAll(
    paginationDto: GetUsersQueryDto,
  ): Promise<GetUsersResponseDto> {
    const { page = 1, limit = 10, search, teamId } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.photo',
        'user.institution',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
      ])
      .leftJoin('user.teams', 'userTeam')
      .addSelect([
        'userTeam.userId',
        'userTeam.teamId',
        'userTeam.createdAt',
        'userTeam.updatedAt',
      ])
      .leftJoin('userTeam.team', 'team')
      .addSelect([
        'team.id',
        'team.name',
        'team.createdAt',
        'team.updatedAt',
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
      .leftJoin('user.userRoles', 'userRole')
      .addSelect(['userRole.id', 'userRole.role', 'userRole.grantedAt']);

    // Adiciona filtro de busca que verifica tanto no nome quanto no email (case-insensitive, partial match)
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Adiciona filtro de busca exata por team IDs
    if (teamId && teamId.length > 0) {
      queryBuilder.andWhere('userTeam.teamId IN (:...teamIds)', {
        teamIds: teamId,
      });
      // Adiciona distinct para evitar duplicatas quando há múltiplos teams
      queryBuilder.distinct(true);
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    const usersWithTeams: UserDto[] = users.map(user => {
      const teams: TeamDto[] = (user.teams || [])
        .filter(userTeam => userTeam.team)
        .map(userTeam => this.mapTeamToDto(userTeam.team));

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        institution: user.institution ?? null,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        teams,
        roles: (user.userRoles ?? []).map((ur) => ur.role),
      };
    });

    return new GetUsersResponseDto(usersWithTeams, page, limit, total);
  }

  async findOne(id: number): Promise<GetUserResponseDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.photo',
        'user.institution',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
      ])
      .leftJoin('user.teams', 'userTeam')
      .addSelect([
        'userTeam.userId',
        'userTeam.teamId',
        'userTeam.createdAt',
        'userTeam.updatedAt',
      ])
      .leftJoin('userTeam.team', 'team')
      .addSelect([
        'team.id',
        'team.name',
        'team.createdAt',
        'team.updatedAt',
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
      .leftJoin('user.userRoles', 'userRole')
      .addSelect(['userRole.id', 'userRole.role', 'userRole.grantedAt'])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const teams: TeamDto[] = (user.teams || [])
      .filter(userTeam => userTeam.team)
      .map(userTeam => this.mapTeamToDto(userTeam.team));

    const userDto: UserDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      institution: user.institution ?? null,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      teams,
      roles: (user.userRoles ?? []).map((ur) => ur.role),
    };

    return new GetUserResponseDto(userDto);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findOneEntity(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Remove user access: sets status to blocked (-1) instead of deleting the record.
   */
  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.status = -1; // blocked
    await this.userRepository.save(user);
  }

  async createUser(createUserDto: CreateUserDto, grantedBy?: number): Promise<User> {
    const { teamIds, roles, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(rest.password, 10);
    const user = this.userRepository.create({ ...rest, password: hashedPassword });
    const savedUser = await this.userRepository.save(user);

    if (teamIds && teamIds.length > 0) {
      const userTeams = teamIds.map((teamId) =>
        this.usersTeamRepository.create({ userId: savedUser.id, teamId }),
      );
      await this.usersTeamRepository.save(userTeams);
    }

    if (roles && roles.length > 0) {
      await this.syncRoles(savedUser.id, roles, grantedBy);
    }

    return savedUser;
  }

  async findOnline(): Promise<GetOnlineUsersResponseDto> {
    const connectionKeys = await this.redisService.keys('online:connections:*');

    if (connectionKeys.length === 0) {
      return new GetOnlineUsersResponseDto([]);
    }

    const ids = (
      await Promise.all(
        connectionKeys.map(async (key) => {
          const socketIds = await this.redisService.smembers(key);
          if (socketIds.length === 0) return null;

          const rawUserId = key.split(':').pop();
          const userId = Number(rawUserId);
          return !Number.isNaN(userId) && userId > 0 ? userId : null;
        }),
      )
    ).filter((id): id is number => id !== null);

    if (ids.length === 0) {
      return new GetOnlineUsersResponseDto([]);
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.photo'])
      .where('user.id IN (:...ids)', { ids })
      .getMany();

    const data: OnlineUserDto[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      photo: u.photo ?? null,
    }));

    return new GetOnlineUsersResponseDto(data);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto, grantedBy?: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { teamIds, roles, ...rest } = updateUserDto;

    if (rest.password) {
      rest.password = await bcrypt.hash(rest.password, 10);
    }

    Object.assign(user, rest);
    const savedUser = await this.userRepository.save(user);

    if (teamIds !== undefined) {
      await this.usersTeamRepository.delete({ userId: id });
      if (teamIds.length > 0) {
        const userTeams = teamIds.map((teamId) =>
          this.usersTeamRepository.create({ userId: id, teamId }),
        );
        await this.usersTeamRepository.save(userTeams);
      }
    }

    if (roles !== undefined) {
      await this.syncRoles(id, roles, grantedBy);
      // Invalida o cache para que o próximo request carregue os novos papéis
      await this.redisService.del(REDIS_KEYS.auth.user(id));
    }

    return savedUser;
  }

  private mapTeamToDto(team: Team): TeamDto {
    const primaryTeamTerritory = getPrimaryTeamTerritory(team.teamTerritories);
    const territoryEntity = primaryTeamTerritory?.territory;
    const territoryId = primaryTeamTerritory?.territoryId ?? null;

    return {
      id: team.id,
      name: team.name,
      territoryId,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      territory: territoryEntity
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
        : null,
    };
  }

  private async syncRoles(userId: number, roles: UserRole[], grantedBy?: number): Promise<void> {
    await this.userRoleRepository.delete({ userId });
    if (roles.length > 0) {
      const entities = roles.map((role) =>
        this.userRoleRepository.create({ userId, role, grantedBy: grantedBy ?? null }),
      );
      await this.userRoleRepository.save(entities);
    }
  }
}
