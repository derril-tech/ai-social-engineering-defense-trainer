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

export enum TemplateType {
    EMAIL = 'email',
    SMS = 'sms',
    VOICE = 'voice',
    CHAT = 'chat',
    WEB = 'web',
}

export enum DifficultyLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    EXPERT = 'expert',
}

@Entity('templates')
export class Template {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: TemplateType,
    })
    type: TemplateType;

    @Column({
        type: 'enum',
        enum: DifficultyLevel,
        default: DifficultyLevel.BEGINNER,
    })
    difficulty: DifficultyLevel;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @Column({ type: 'simple-array', default: [] })
    tags: string[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isPublic: boolean;

    @Column('uuid')
    organizationId: string;

    @ManyToOne(() => Organization, (organization) => organization.templates)
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
