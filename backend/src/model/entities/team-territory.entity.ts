import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { Territory } from './territory.entity';

@Entity({
  name: 'team_territories',
  schema: 'public_app',
})
export class TeamTerritory {
  @PrimaryColumn({
    name: 'team_id',
    type: 'integer',
  })
  teamId: number;

  @PrimaryColumn({
    name: 'territory_id',
    type: 'integer',
  })
  territoryId: number;

  @ManyToOne(() => Team, (team) => team.teamTerritories)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => Territory)
  @JoinColumn({ name: 'territory_id' })
  territory: Territory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
