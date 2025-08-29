import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CasbinService } from '../common/services/casbin.service';

@Module({
    controllers: [AnalyticsController],
    providers: [AnalyticsService, CasbinService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
