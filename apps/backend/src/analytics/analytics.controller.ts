import {
    Controller,
    Get,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('campaigns/stats')
    @Roles('admin', 'manager', 'analyst')
    @ApiOperation({ summary: 'Get campaign statistics' })
    @ApiQuery({ name: 'campaignId', required: false })
    @ApiResponse({ status: 200, description: 'Campaign stats retrieved successfully' })
    getCampaignStats(@Request() req, @Query('campaignId') campaignId?: string) {
        return this.analyticsService.getCampaignStats(req.user.organizationId, campaignId);
    }

    @Get('risk/heatmap')
    @Roles('admin', 'manager', 'analyst')
    @ApiOperation({ summary: 'Get risk heatmap data' })
    @ApiResponse({ status: 200, description: 'Risk heatmap retrieved successfully' })
    getRiskHeatmap(@Request() req) {
        return this.analyticsService.getRiskHeatmap(req.user.organizationId);
    }

    @Get('campaigns/:campaignId/funnel')
    @Roles('admin', 'manager', 'analyst')
    @ApiOperation({ summary: 'Get campaign funnel metrics' })
    @ApiResponse({ status: 200, description: 'Funnel metrics retrieved successfully' })
    getFunnelMetrics(@Request() req, @Query('campaignId') campaignId: string) {
        return this.analyticsService.getFunnelMetrics(req.user.organizationId, campaignId);
    }

    @Get('compliance/report')
    @Roles('admin', 'manager', 'analyst')
    @ApiOperation({ summary: 'Get compliance report' })
    @ApiResponse({ status: 200, description: 'Compliance report retrieved successfully' })
    getComplianceReport(@Request() req) {
        return this.analyticsService.getComplianceReport(req.user.organizationId);
    }
}
