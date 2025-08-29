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

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    passwordHash?: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'simple-array', default: [] })
    roles: string[];

    @Column({ nullable: true })
    lastLoginAt?: Date;

    @Column({ nullable: true })
    mfaSecret?: string;

    @Column({ default: false })
    mfaEnabled: boolean;

    @Column('uuid')
    organizationId: string;

    @ManyToOne(() => Organization, (organization) => organization.users)
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
