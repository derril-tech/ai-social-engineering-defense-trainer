import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Template } from '../templates/entities/template.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
    constructor(private configService: ConfigService) { }

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            url: this.configService.get<string>('DATABASE_URL'),
            entities: [User, Organization, Campaign, Template],
            synchronize: this.configService.get<string>('NODE_ENV') === 'development',
            logging: this.configService.get<string>('NODE_ENV') === 'development',
            ssl: this.configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        };
    }
}
