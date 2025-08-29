import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrivacyService } from './privacy.service';

interface OptOutRequest {
    email: string;
    reason?: string;
    effectiveDate?: string;
}

interface WaiverRequest {
    userId: string;
    waiverType: 'training' | 'simulation' | 'data_collection';
    reason: string;
    approvedBy: string;
    expiresAt?: string;
}

interface DataResidencyRequest {
    organizationId: string;
    region: 'us' | 'eu' | 'apac' | 'ca';
    dataTypes: string[];
    effectiveDate: string;
}

@ApiTags('Privacy & Compliance')
@Controller('privacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrivacyController {
    constructor(private readonly privacyService: PrivacyService) { }

    @Get('opt-out/:email')
    @ApiOperation({ summary: 'Check opt-out status for email' })
    @ApiResponse({ status: 200, description: 'Opt-out status retrieved' })
    async getOptOutStatus(@Param('email') email: string) {
        const status = await this.privacyService.getOptOutStatus(email);
        return {
            email,
            isOptedOut: status.isOptedOut,
            optOutDate: status.optOutDate,
            reason: status.reason,
            canOptIn: status.canOptIn
        };
    }

    @Post('opt-out')
    @ApiOperation({ summary: 'Opt out user from training simulations' })
    @ApiResponse({ status: 201, description: 'User opted out successfully' })
    async optOutUser(@Body() optOutData: OptOutRequest) {
        const result = await this.privacyService.optOutUser(
            optOutData.email,
            optOutData.reason,
            optOutData.effectiveDate ? new Date(optOutData.effectiveDate) : new Date()
        );

        return {
            success: true,
            message: 'User successfully opted out of training simulations',
            optOutId: result.optOutId,
            effectiveDate: result.effectiveDate
        };
    }

    @Post('opt-in')
    @ApiOperation({ summary: 'Opt user back into training simulations' })
    @ApiResponse({ status: 200, description: 'User opted in successfully' })
    async optInUser(@Body() { email, reason }: { email: string; reason?: string }) {
        const result = await this.privacyService.optInUser(email, reason);

        return {
            success: true,
            message: 'User successfully opted back into training simulations',
            optInId: result.optInId,
            effectiveDate: result.effectiveDate
        };
    }

    @Get('waivers')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Get all active waivers' })
    @ApiResponse({ status: 200, description: 'Waivers retrieved' })
    async getWaivers(
        @Query('organizationId') orgId?: string,
        @Query('type') waiverType?: string,
        @Query('status') status?: string
    ) {
        const waivers = await this.privacyService.getWaivers({
            organizationId: orgId,
            type: waiverType,
            status: status
        });

        return {
            waivers,
            total: waivers.length,
            filters: { organizationId: orgId, type: waiverType, status }
        };
    }

    @Post('waivers')
    @Roles('admin', 'privacy_officer', 'manager')
    @ApiOperation({ summary: 'Create privacy waiver for user' })
    @ApiResponse({ status: 201, description: 'Waiver created successfully' })
    async createWaiver(@Body() waiverData: WaiverRequest, @Req() req) {
        const waiver = await this.privacyService.createWaiver({
            userId: waiverData.userId,
            waiverType: waiverData.waiverType,
            reason: waiverData.reason,
            approvedBy: waiverData.approvedBy,
            createdBy: req.user.id,
            expiresAt: waiverData.expiresAt ? new Date(waiverData.expiresAt) : undefined
        });

        return {
            success: true,
            message: 'Privacy waiver created successfully',
            waiver: {
                id: waiver.id,
                userId: waiver.userId,
                type: waiver.waiverType,
                status: waiver.status,
                createdAt: waiver.createdAt,
                expiresAt: waiver.expiresAt
            }
        };
    }

    @Put('waivers/:waiverId')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Update waiver status' })
    @ApiResponse({ status: 200, description: 'Waiver updated successfully' })
    async updateWaiver(
        @Param('waiverId') waiverId: string,
        @Body() updateData: { status: 'approved' | 'denied' | 'revoked'; reason?: string },
        @Req() req
    ) {
        const waiver = await this.privacyService.updateWaiverStatus(
            waiverId,
            updateData.status,
            req.user.id,
            updateData.reason
        );

        return {
            success: true,
            message: `Waiver ${updateData.status} successfully`,
            waiver
        };
    }

    @Delete('waivers/:waiverId')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Revoke privacy waiver' })
    @ApiResponse({ status: 200, description: 'Waiver revoked successfully' })
    async revokeWaiver(@Param('waiverId') waiverId: string, @Req() req) {
        await this.privacyService.revokeWaiver(waiverId, req.user.id);

        return {
            success: true,
            message: 'Privacy waiver revoked successfully'
        };
    }

    @Get('exclusions')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Get exclusion list for campaigns' })
    @ApiResponse({ status: 200, description: 'Exclusion list retrieved' })
    async getExclusionList(@Query('organizationId') orgId: string) {
        const exclusions = await this.privacyService.getExclusionList(orgId);

        return {
            exclusions: exclusions.map(exclusion => ({
                userId: exclusion.userId,
                email: exclusion.email,
                reason: exclusion.reason,
                type: exclusion.type,
                effectiveDate: exclusion.effectiveDate,
                expiresAt: exclusion.expiresAt
            })),
            total: exclusions.length,
            organizationId: orgId
        };
    }

    @Post('exclusions')
    @Roles('admin', 'privacy_officer', 'manager')
    @ApiOperation({ summary: 'Add user to exclusion list' })
    @ApiResponse({ status: 201, description: 'User added to exclusion list' })
    async addToExclusionList(
        @Body() exclusionData: {
            userId: string;
            reason: string;
            type: 'permanent' | 'temporary';
            expiresAt?: string;
        },
        @Req() req
    ) {
        const exclusion = await this.privacyService.addToExclusionList({
            userId: exclusionData.userId,
            reason: exclusionData.reason,
            type: exclusionData.type,
            createdBy: req.user.id,
            expiresAt: exclusionData.expiresAt ? new Date(exclusionData.expiresAt) : undefined
        });

        return {
            success: true,
            message: 'User added to exclusion list successfully',
            exclusion
        };
    }

    @Delete('exclusions/:userId')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Remove user from exclusion list' })
    @ApiResponse({ status: 200, description: 'User removed from exclusion list' })
    async removeFromExclusionList(@Param('userId') userId: string, @Req() req) {
        await this.privacyService.removeFromExclusionList(userId, req.user.id);

        return {
            success: true,
            message: 'User removed from exclusion list successfully'
        };
    }

    @Get('data-residency/:organizationId')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Get data residency settings' })
    @ApiResponse({ status: 200, description: 'Data residency settings retrieved' })
    async getDataResidencySettings(@Param('organizationId') orgId: string) {
        const settings = await this.privacyService.getDataResidencySettings(orgId);

        return {
            organizationId: orgId,
            dataResidency: settings
        };
    }

    @Post('data-residency')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Configure data residency settings' })
    @ApiResponse({ status: 201, description: 'Data residency configured successfully' })
    async configureDataResidency(@Body() residencyData: DataResidencyRequest, @Req() req) {
        const settings = await this.privacyService.configureDataResidency({
            organizationId: residencyData.organizationId,
            region: residencyData.region,
            dataTypes: residencyData.dataTypes,
            effectiveDate: new Date(residencyData.effectiveDate),
            configuredBy: req.user.id
        });

        return {
            success: true,
            message: 'Data residency settings configured successfully',
            settings
        };
    }

    @Get('consent/:userId')
    @ApiOperation({ summary: 'Get user consent status' })
    @ApiResponse({ status: 200, description: 'Consent status retrieved' })
    async getConsentStatus(@Param('userId') userId: string) {
        const consent = await this.privacyService.getConsentStatus(userId);

        return {
            userId,
            consent: {
                training: consent.training,
                dataCollection: consent.dataCollection,
                communications: consent.communications,
                analytics: consent.analytics,
                lastUpdated: consent.lastUpdated
            }
        };
    }

    @Post('consent/:userId')
    @ApiOperation({ summary: 'Update user consent preferences' })
    @ApiResponse({ status: 200, description: 'Consent updated successfully' })
    async updateConsent(
        @Param('userId') userId: string,
        @Body() consentData: {
            training?: boolean;
            dataCollection?: boolean;
            communications?: boolean;
            analytics?: boolean;
        }
    ) {
        const consent = await this.privacyService.updateConsent(userId, consentData);

        return {
            success: true,
            message: 'Consent preferences updated successfully',
            consent
        };
    }

    @Get('audit-log')
    @Roles('admin', 'privacy_officer', 'auditor')
    @ApiOperation({ summary: 'Get privacy audit log' })
    @ApiResponse({ status: 200, description: 'Audit log retrieved' })
    async getAuditLog(
        @Query('organizationId') orgId?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string
    ) {
        const auditLog = await this.privacyService.getAuditLog({
            organizationId: orgId,
            userId: userId,
            action: action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit) : 100
        });

        return {
            auditLog,
            total: auditLog.length,
            filters: { organizationId: orgId, userId, action, startDate, endDate }
        };
    }

    @Post('data-export/:userId')
    @ApiOperation({ summary: 'Request user data export (GDPR)' })
    @ApiResponse({ status: 202, description: 'Data export request submitted' })
    async requestDataExport(
        @Param('userId') userId: string,
        @Body() exportRequest: { format?: 'json' | 'csv'; includeAnalytics?: boolean }
    ) {
        const exportJob = await this.privacyService.requestDataExport(
            userId,
            exportRequest.format || 'json',
            exportRequest.includeAnalytics || false
        );

        return {
            success: true,
            message: 'Data export request submitted successfully',
            exportJobId: exportJob.id,
            estimatedCompletionTime: exportJob.estimatedCompletionTime
        };
    }

    @Post('data-deletion/:userId')
    @Roles('admin', 'privacy_officer')
    @ApiOperation({ summary: 'Request user data deletion (Right to be forgotten)' })
    @ApiResponse({ status: 202, description: 'Data deletion request submitted' })
    async requestDataDeletion(
        @Param('userId') userId: string,
        @Body() deletionRequest: {
            reason: string;
            retentionOverride?: boolean;
            approvedBy: string;
        },
        @Req() req
    ) {
        const deletionJob = await this.privacyService.requestDataDeletion(
            userId,
            deletionRequest.reason,
            req.user.id,
            deletionRequest.approvedBy,
            deletionRequest.retentionOverride || false
        );

        return {
            success: true,
            message: 'Data deletion request submitted successfully',
            deletionJobId: deletionJob.id,
            scheduledFor: deletionJob.scheduledFor
        };
    }

    @Get('compliance-report/:organizationId')
    @Roles('admin', 'privacy_officer', 'compliance')
    @ApiOperation({ summary: 'Generate privacy compliance report' })
    @ApiResponse({ status: 200, description: 'Compliance report generated' })
    async generateComplianceReport(
        @Param('organizationId') orgId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        const report = await this.privacyService.generateComplianceReport(
            orgId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        return {
            organizationId: orgId,
            reportPeriod: {
                startDate: report.startDate,
                endDate: report.endDate
            },
            compliance: {
                gdprCompliance: report.gdprCompliance,
                ccpaCompliance: report.ccpaCompliance,
                dataResidencyCompliance: report.dataResidencyCompliance,
                consentCompliance: report.consentCompliance
            },
            metrics: {
                totalUsers: report.totalUsers,
                optedOutUsers: report.optedOutUsers,
                activeWaivers: report.activeWaivers,
                dataExportRequests: report.dataExportRequests,
                dataDeletionRequests: report.dataDeletionRequests
            },
            recommendations: report.recommendations
        };
    }
}
