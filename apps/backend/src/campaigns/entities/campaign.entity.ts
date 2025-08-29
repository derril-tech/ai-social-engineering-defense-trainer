import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Template } from '../../templates/entities/template.entity';

export enum CampaignStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum CampaignType {
    EMAIL = 'email',
    SMS = 'sms',
    VOICE = 'voice',
    CHAT = 'chat',
    WEB = 'web',
}

@Entity('campaigns')
export class Campaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: CampaignType,
    })
    type: CampaignType;

    @Column({
        type: 'enum',
        enum: CampaignStatus,
        default: CampaignStatus.DRAFT,
    })
    status: CampaignStatus;

    @Column({ type: 'jsonb', default: {} })
    configuration: Record<string, any>;

    @Column({ nullable: true })
    scheduledAt?: Date;

    @Column({ nullable: true })
    startedAt?: Date;

    @Column({ nullable: true })
    completedAt?: Date;

    @Column('uuid')
    organizationId: string;

    @ManyToOne(() => Organization, (organization) => organization.campaigns)
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @Column('uuid')
    templateId: string;

    @ManyToOne(() => Template)
    @JoinColumn({ name: 'templateId' })
    template: Template;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
