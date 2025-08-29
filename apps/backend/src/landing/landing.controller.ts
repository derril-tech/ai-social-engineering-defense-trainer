import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Req,
    Res,
    UseGuards,
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LandingService } from './landing.service';
import { TelemetryService } from './telemetry.service';

@ApiTags('Landing Pages')
@Controller('landing')
export class LandingController {
    constructor(
        private readonly landingService: LandingService,
        private readonly telemetryService: TelemetryService,
    ) { }

    @Get(':campaignId/:userId')
    @ApiOperation({ summary: 'Serve simulation landing page' })
    @ApiResponse({ status: 200, description: 'Landing page served' })
    async serveLandingPage(
        @Param('campaignId') campaignId: string,
        @Param('userId') userId: string,
        @Query('template') templateId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // Log landing page visit
        await this.telemetryService.recordEvent({
            event_type: 'landing_visited',
            campaign_id: campaignId,
            user_id: userId,
            org_id: req.headers['x-org-id'] as string,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            properties: {
                template_id: templateId,
                referrer: req.headers.referer,
                timestamp: new Date().toISOString(),
            },
        });

        // Get landing page content
        const landingPage = await this.landingService.generateLandingPage(
            campaignId,
            userId,
            templateId,
        );

        // Set security headers
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'no-referrer');

        // Serve the landing page
        res.setHeader('Content-Type', 'text/html');
        res.send(landingPage);
    }

    @Post(':campaignId/:userId/submit')
    @ApiOperation({ summary: 'Handle form submission (training simulation)' })
    @ApiResponse({ status: 200, description: 'Form submission recorded' })
    async handleFormSubmission(
        @Param('campaignId') campaignId: string,
        @Param('userId') userId: string,
        @Body() formData: any,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // CRITICAL: Never store actual credentials - this is for training only
        const sanitizedData = this.sanitizeFormData(formData);

        // Log form submission event
        await this.telemetryService.recordEvent({
            event_type: 'landing_form_submitted',
            campaign_id: campaignId,
            user_id: userId,
            org_id: req.headers['x-org-id'] as string,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            properties: {
                form_fields: Object.keys(sanitizedData),
                field_count: Object.keys(sanitizedData).length,
                timestamp: new Date().toISOString(),
            },
        });

        // Generate coaching response
        const coachingResponse = await this.landingService.generateCoachingResponse(
            campaignId,
            userId,
            'form_submission',
        );

        // Return coaching page instead of processing form
        res.setHeader('Content-Type', 'text/html');
        res.send(coachingResponse);
    }

    @Get('track/open/:trackingId')
    @ApiOperation({ summary: 'Track email opens' })
    async trackEmailOpen(
        @Param('trackingId') trackingId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // Parse tracking ID to extract campaign and user info
        const trackingInfo = this.parseTrackingId(trackingId);

        if (trackingInfo) {
            await this.telemetryService.recordEvent({
                event_type: 'email_opened',
                campaign_id: trackingInfo.campaignId,
                user_id: trackingInfo.userId,
                org_id: trackingInfo.orgId,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                properties: {
                    tracking_id: trackingId,
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Return 1x1 transparent pixel
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64',
        );
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Content-Length', pixel.length.toString());
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(pixel);
    }

    @Get('track/click/:trackingId')
    @ApiOperation({ summary: 'Track link clicks' })
    async trackLinkClick(
        @Param('trackingId') trackingId: string,
        @Query('url') originalUrl: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // Parse tracking ID
        const trackingInfo = this.parseTrackingId(trackingId);

        if (trackingInfo) {
            await this.telemetryService.recordEvent({
                event_type: 'email_clicked',
                campaign_id: trackingInfo.campaignId,
                user_id: trackingInfo.userId,
                org_id: trackingInfo.orgId,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                properties: {
                    tracking_id: trackingId,
                    original_url: originalUrl,
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Redirect to landing page instead of original URL
        const landingUrl = `/api/v1/landing/${trackingInfo?.campaignId}/${trackingInfo?.userId}`;
        res.redirect(302, landingUrl);
    }

    @Post('report/:campaignId/:userId')
    @ApiOperation({ summary: 'Handle phishing reports' })
    @ApiResponse({ status: 200, description: 'Report recorded' })
    async handlePhishingReport(
        @Param('campaignId') campaignId: string,
        @Param('userId') userId: string,
        @Body() reportData: any,
        @Req() req: Request,
    ) {
        // Log phishing report
        await this.telemetryService.recordEvent({
            event_type: 'email_reported',
            campaign_id: campaignId,
            user_id: userId,
            org_id: req.headers['x-org-id'] as string,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            properties: {
                report_reason: reportData.reason,
                report_method: reportData.method || 'manual',
                timestamp: new Date().toISOString(),
            },
        });

        // Generate positive coaching response
        const coachingResponse = await this.landingService.generateCoachingResponse(
            campaignId,
            userId,
            'phishing_report',
        );

        return {
            success: true,
            message: 'Thank you for reporting this suspicious message!',
            coaching: coachingResponse,
        };
    }

    private sanitizeFormData(formData: any): any {
        // Remove any potential credentials or sensitive data
        const sanitized = { ...formData };

        // Remove common credential field names
        const sensitiveFields = [
            'password', 'passwd', 'pwd', 'pass',
            'ssn', 'social_security', 'credit_card', 'cc_number',
            'cvv', 'cvc', 'pin', 'account_number'
        ];

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    private parseTrackingId(trackingId: string): {
        campaignId: string;
        userId: string;
        orgId: string;
    } | null {
        try {
            // Tracking ID format: campaignId_userId_timestamp
            const parts = trackingId.split('_');
            if (parts.length >= 3) {
                return {
                    campaignId: parts[0],
                    userId: parts[1],
                    orgId: parts[2] || 'default',
                };
            }
        } catch (error) {
            console.error('Failed to parse tracking ID:', error);
        }
        return null;
    }
}
