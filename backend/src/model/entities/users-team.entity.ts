import { Entity, UpdateDateColumn, CreateDateColumn, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';

@Entity({
    name: 'user_teams',
    schema: 'public_app'
})
export class UsersTeam {

    @PrimaryColumn({
        name: 'user_id',
        type: 'integer'
    })
    userId: number;

    @PrimaryColumn({
        name: 'team_id',
        type: 'integer'
    })
    teamId: number;

    @ManyToOne(type => User, user => user.teams)
    @JoinColumn({
        name: 'user_id'
    })
    user: User;

    @ManyToOne(type => Team, team => team.userTeams)
    @JoinColumn({
        name: 'team_id'
    })
    team: Team;

    @CreateDateColumn({
        name: 'created_at'
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at'
    })
    updatedAt: Date;
} 