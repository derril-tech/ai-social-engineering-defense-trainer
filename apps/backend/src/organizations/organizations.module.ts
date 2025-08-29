import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { CasbinService } from '../common/services/casbin.service';

@Module({
    imports: [TypeOrmModule.forFeature([Organization])],
    controllers: [OrganizationsController],
    providers: [OrganizationsService, CasbinService],
    exports: [OrganizationsService],
})
export class OrganizationsModule { }
