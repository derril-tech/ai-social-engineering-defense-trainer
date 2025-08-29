import {
    Controller,
    Post,
    Body,
    Headers,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ReportPluginsService } from './report-plugins.service';
import { TelemetryService } from '../landing/telemetry.service';

interface OutlookReportRequest {
    messageId: string;
    sender: string;
    subject: string;
    receivedTime: string;
    userEmail: string;
    organizationId: string;
    reportReason?: string;
}

interface SlackReportRequest {
    token: string;
    team_id: string;
    team_domain: string;
    channel_id: string;
    channel_name: string;
    user_id: string;
    user_name: string;
    command: string;
    text: string;
    response_url: string;
    trigger_id: string;
}

interface GmailReportRequest {
    messageId: string;
    threadId: string;
    sender: string;
    subject: string;
    snippet: string;
    userEmail: string;
    organizationId: string;
    reportReason?: string;
}

@ApiTags('Report Plugins')
@Controller('plugins/report')
export class ReportPluginsController {
    constructor(
        private readonly reportPluginsService: ReportPluginsService,
        private readonly telemetryService: TelemetryService,
    ) { }

    @Post('outlook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Outlook phishing reports' })
    @ApiHeader({ name: 'X-API-Key', description: 'Plugin API key' })
    @ApiResponse({ status: 200, description: 'Report processed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid API key' })
    async handleOutlookReport(
        @Body() reportData: OutlookReportRequest,
        @Headers('x-api-key') apiKey: string,
        @Headers('x-org-id') orgId: string,
    ) {
        // Validate API key
        if (!this.reportPluginsService.validateApiKey(apiKey, 'outlook')) {
            throw new UnauthorizedException('Invalid API key');
        }

        // Process the report
        const result = await this.reportPluginsService.processOutlookReport(
            reportData,
            orgId,
        );

        // Log the report event
        await this.telemetryService.recordEvent({
            event_type: 'email_reported',
            campaign_id: result.campaignId || 'unknown',
            user_id: result.userId || reportData.userEmail,
            org_id: orgId,
            ip_address: '0.0.0.0', // Plugin reports don't have IP
            user_agent: 'Outlook Plugin',
            properties: {
                plugin: 'outlook',
                message_id: reportData.messageId,
                sender: reportData.sender,
                subject: reportData.subject,
                report_reason: reportData.reportReason || 'suspicious',
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: true,
            message: result.isSimulation
                ? 'Thank you for reporting this training simulation! You did the right thing.'
                : 'Thank you for reporting this suspicious email. Our security team will investigate.',
            isTrainingSimulation: result.isSimulation,
            coachingMessage: result.coachingMessage,
        };
    }

    @Post('gmail')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Gmail phishing reports' })
    @ApiHeader({ name: 'X-API-Key', description: 'Plugin API key' })
    @ApiResponse({ status: 200, description: 'Report processed successfully' })
    async handleGmailReport(
        @Body() reportData: GmailReportRequest,
        @Headers('x-api-key') apiKey: string,
        @Headers('x-org-id') orgId: string,
    ) {
        // Validate API key
        if (!this.reportPluginsService.validateApiKey(apiKey, 'gmail')) {
            throw new UnauthorizedException('Invalid API key');
        }

        // Process the report
        const result = await this.reportPluginsService.processGmailReport(
            reportData,
            orgId,
        );

        // Log the report event
        await this.telemetryService.recordEvent({
            event_type: 'email_reported',
            campaign_id: result.campaignId || 'unknown',
            user_id: result.userId || reportData.userEmail,
            org_id: orgId,
            ip_address: '0.0.0.0',
            user_agent: 'Gmail Plugin',
            properties: {
                plugin: 'gmail',
                message_id: reportData.messageId,
                thread_id: reportData.threadId,
                sender: reportData.sender,
                subject: reportData.subject,
                snippet: reportData.snippet,
                report_reason: reportData.reportReason || 'suspicious',
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: true,
            message: result.isSimulation
                ? 'Excellent! You correctly identified this training simulation.'
                : 'Thank you for reporting this suspicious email.',
            isTrainingSimulation: result.isSimulation,
            coachingMessage: result.coachingMessage,
        };
    }

    @Post('slack')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Slack phishing reports' })
    @ApiResponse({ status: 200, description: 'Slack command response' })
    async handleSlackReport(@Body() slackData: SlackReportRequest) {
        // Validate Slack token
        if (!this.reportPluginsService.validateSlackToken(slackData.token)) {
            return {
                response_type: 'ephemeral',
                text: 'Invalid request token.',
            };
        }

        // Parse the reported content
        const reportContent = slackData.text;

        // Process the report
        const result = await this.reportPluginsService.processSlackReport(
            slackData,
            reportContent,
        );

        // Log the report event
        await this.telemetryService.recordEvent({
            event_type: 'chat_reported',
            campaign_id: result.campaignId || 'unknown',
            user_id: slackData.user_id,
            org_id: slackData.team_id,
            ip_address: '0.0.0.0',
            user_agent: 'Slack Plugin',
            properties: {
                plugin: 'slack',
                channel_id: slackData.channel_id,
                channel_name: slackData.channel_name,
                user_name: slackData.user_name,
                reported_content: reportContent,
                timestamp: new Date().toISOString(),
            },
        });

        // Return Slack-formatted response
        return {
            response_type: 'ephemeral',
            text: result.isSimulation
                ? '🎉 Great job! You correctly identified a training simulation.'
                : '✅ Thank you for reporting suspicious content.',
            attachments: [
                {
                    color: result.isSimulation ? 'good' : 'warning',
                    fields: [
                        {
                            title: result.isSimulation ? 'Training Simulation Detected' : 'Report Received',
                            value: result.message,
                            short: false,
                        },
                    ],
                },
            ],
        };
    }

    @Post('teams')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Microsoft Teams phishing reports' })
    @ApiHeader({ name: 'X-API-Key', description: 'Plugin API key' })
    @ApiResponse({ status: 200, description: 'Teams report processed' })
    async handleTeamsReport(
        @Body() teamsData: any,
        @Headers('x-api-key') apiKey: string,
        @Headers('x-org-id') orgId: string,
    ) {
        // Validate API key
        if (!this.reportPluginsService.validateApiKey(apiKey, 'teams')) {
            throw new UnauthorizedException('Invalid API key');
        }

        // Process Teams report
        const result = await this.reportPluginsService.processTeamsReport(
            teamsData,
            orgId,
        );

        // Log the report event
        await this.telemetryService.recordEvent({
            event_type: 'chat_reported',
            campaign_id: result.campaignId || 'unknown',
            user_id: teamsData.from?.id || 'unknown',
            org_id: orgId,
            ip_address: '0.0.0.0',
            user_agent: 'Teams Plugin',
            properties: {
                plugin: 'teams',
                conversation_id: teamsData.conversation?.id,
                activity_type: teamsData.type,
                timestamp: new Date().toISOString(),
            },
        });

        // Return Teams-formatted response
        return {
            type: 'message',
            text: result.isSimulation
                ? '🎓 Excellent! You identified a training simulation. This is exactly what you should do with suspicious messages.'
                : '🛡️ Thank you for reporting suspicious content. Our security team will investigate.',
        };
    }

    @Post('webhook/generic')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generic webhook for custom integrations' })
    @ApiHeader({ name: 'X-API-Key', description: 'Webhook API key' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    async handleGenericWebhook(
        @Body() webhookData: any,
        @Headers('x-api-key') apiKey: string,
        @Headers('x-org-id') orgId: string,
        @Headers('x-source') source: string,
    ) {
        // Validate API key
        if (!this.reportPluginsService.validateApiKey(apiKey, 'webhook')) {
            throw new UnauthorizedException('Invalid API key');
        }

        // Process generic report
        const result = await this.reportPluginsService.processGenericReport(
            webhookData,
            orgId,
            source,
        );

        // Log the report event
        await this.telemetryService.recordEvent({
            event_type: 'generic_reported',
            campaign_id: result.campaignId || 'unknown',
            user_id: webhookData.user_id || 'unknown',
            org_id: orgId,
            ip_address: '0.0.0.0',
            user_agent: `${source} Webhook`,
            properties: {
                plugin: 'webhook',
                source: source,
                webhook_data: JSON.stringify(webhookData),
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: true,
            message: result.message,
            isTrainingSimulation: result.isSimulation,
            coachingUrl: result.coachingUrl,
        };
    }
}
