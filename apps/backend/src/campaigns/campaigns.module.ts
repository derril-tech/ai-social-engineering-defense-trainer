import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { Campaign } from './entities/campaign.entity';
import { CasbinService } from '../common/services/casbin.service';

@Module({
    imports: [TypeOrmModule.forFeature([Campaign])],
    controllers: [CampaignsController],
    providers: [CampaignsService, CasbinService],
    exports: [CampaignsService],
})
export class CampaignsModule { }
