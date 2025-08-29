import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Template } from '../../templates/entities/template.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    domain?: string;

    @Column({ type: 'jsonb', default: {} })
    settings: Record<string, any>;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    subscriptionTier?: string;

    @Column({ nullable: true })
    subscriptionExpiresAt?: Date;

    @OneToMany(() => User, (user) => user.organization)
    users: User[];

    @OneToMany(() => Campaign, (campaign) => campaign.organization)
    campaigns: Campaign[];

    @OneToMany(() => Template, (template) => template.organization)
    templates: Template[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
