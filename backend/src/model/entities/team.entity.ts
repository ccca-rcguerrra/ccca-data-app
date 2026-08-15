import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { UsersTeam } from './users-team.entity';
import { TeamTerritory } from './team-territory.entity';
import { Territory } from './territory.entity';

@Entity({
    name: 'teams',
    schema: 'public_app'
})
export class Team {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 500 })
    name: string;

    /** @deprecated Use team_territories instead. Kept for legacy compatibility. */
    @Column({
        name: 'territory_id',
        type: 'integer',
        nullable: true
    })
    territoryId: number;

    /** @deprecated Use teamTerritories instead. Kept for legacy compatibility. */
    @ManyToOne(type => Territory)
    @JoinColumn({
        name: 'territory_id',
        referencedColumnName: 'id',
    })
    territory: Territory;

    @OneToMany(type => TeamTerritory, teamTerritory => teamTerritory.team)
    teamTerritories: TeamTerritory[];

    @OneToMany(type => UsersTeam, userTeam => userTeam.team)
    userTeams: UsersTeam[];

    @CreateDateColumn({
        name: 'created_at'
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at'
    })
    updatedAt: Date;
}