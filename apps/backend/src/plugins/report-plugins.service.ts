import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Injectable()
export class ReportPluginsService {
    constructor(
        private configService: ConfigService,
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
    ) { }

    validateApiKey(apiKey: string, pluginType: string): boolean {
        const validKeys = this.configService
            .get<string>(`PLUGIN_API_KEYS_${pluginType.toUpperCase()}`, '')
            .split(',');

        return validKeys.includes(apiKey);
    }

    validateSlackToken(token: string): boolean {
        const validToken = this.configService.get<string>('SLACK_VERIFICATION_TOKEN');
        return token === validToken;
    }

    async processOutlookReport(reportData: any, orgId: string) {
        // Check if this is a simulation email
        const simulation = await this.identifySimulation(
            reportData.messageId,
            reportData.sender,
            reportData.subject,
            orgId,
        );

        if (simulation) {
            return {
                isSimulation: true,
                campaignId: simulation.campaignId,
                userId: simulation.userId,
                message: 'Excellent work! You correctly identified this training simulation.',
                coachingMessage: this.generateCoachingMessage('outlook_report_success'),
            };
        }

        // Handle real phishing report
        await this.forwardToSecurityTeam(reportData, 'outlook', orgId);

        return {
            isSimulation: false,
            message: 'Thank you for reporting this suspicious email. Our security team will investigate.',
        };
    }

    async processGmailReport(reportData: any, orgId: string) {
        // Check if this is a simulation email
        const simulation = await this.identifySimulation(
            reportData.messageId,
            reportData.sender,
            reportData.subject,
            orgId,
        );

        if (simulation) {
            return {
                isSimulation: true,
                campaignId: simulation.campaignId,
                userId: simulation.userId,
                message: 'Perfect! You spotted the training simulation.',
                coachingMessage: this.generateCoachingMessage('gmail_report_success'),
            };
        }

        // Handle real phishing report
        await this.forwardToSecurityTeam(reportData, 'gmail', orgId);

        return {
            isSimulation: false,
            message: 'Thank you for the report. We will investigate this email.',
        };
    }

    async processSlackReport(slackData: any, reportContent: string) {
        // Check if this is a simulation message
        const simulation = await this.identifySlackSimulation(
            reportContent,
            slackData.team_id,
        );

        if (simulation) {
            return {
                isSimulation: true,
                campaignId: simulation.campaignId,
                userId: slackData.user_id,
                message: 'Great job identifying this training simulation! You\'re helping keep our team secure.',
            };
        }

        // Handle real suspicious content report
        await this.forwardToSecurityTeam(
            {
                content: reportContent,
                channel: slackData.channel_name,
                user: slackData.user_name,
                team: slackData.team_domain,
            },
            'slack',
            slackData.team_id,
        );

        return {
            isSimulation: false,
            message: 'Thank you for reporting suspicious content. Our security team has been notified.',
        };
    }

    async processTeamsReport(teamsData: any, orgId: string) {
        // Extract message content from Teams data
        const messageContent = teamsData.text || teamsData.value || '';

        // Check if this is a simulation
        const simulation = await this.identifyTeamsSimulation(messageContent, orgId);

        if (simulation) {
            return {
                isSimulation: true,
                campaignId: simulation.campaignId,
                userId: teamsData.from?.id,
                message: 'Excellent! You correctly identified this as a training simulation.',
            };
        }

        // Handle real report
        await this.forwardToSecurityTeam(teamsData, 'teams', orgId);

        return {
            isSimulation: false,
            message: 'Thank you for the report. Our security team will review this content.',
        };
    }

    async processGenericReport(webhookData: any, orgId: string, source: string) {
        // Generic processing for custom integrations
        const simulation = await this.identifyGenericSimulation(webhookData, orgId);

        if (simulation) {
            return {
                isSimulation: true,
                campaignId: simulation.campaignId,
                userId: webhookData.user_id,
                message: 'Training simulation correctly identified!',
                coachingUrl: `/coaching/${simulation.campaignId}/${webhookData.user_id}`,
            };
        }

        // Handle real report
        await this.forwardToSecurityTeam(webhookData, source, orgId);

        return {
            isSimulation: false,
            message: 'Report received and forwarded to security team.',
        };
    }

    private async identifySimulation(
        messageId: string,
        sender: string,
        subject: string,
        orgId: string,
    ): Promise<{ campaignId: string; userId: string } | null> {
        // Check for training simulation indicators
        const simulationIndicators = [
            '[TRAINING SIMULATION]',
            'training-simulation.com',
            'ai-defense-trainer.com',
            'phishing-simulation',
        ];

        // Check subject line
        const hasSimulationIndicator = simulationIndicators.some(indicator =>
            subject.toLowerCase().includes(indicator.toLowerCase()) ||
            sender.toLowerCase().includes(indicator.toLowerCase())
        );

        if (hasSimulationIndicator) {
            // Try to extract campaign and user info from message ID or sender
            const campaignMatch = messageId.match(/campaign[_-]([a-f0-9-]+)/i);
            const userMatch = messageId.match(/user[_-]([a-f0-9-]+)/i);

            return {
                campaignId: campaignMatch?.[1] || 'unknown',
                userId: userMatch?.[1] || 'unknown',
            };
        }

        // Check database for active campaigns
        const activeCampaigns = await this.campaignsRepository.find({
            where: {
                organizationId: orgId,
                status: 'running',
            },
        });

        // More sophisticated matching could be implemented here
        // For now, return null if no obvious simulation indicators
        return null;
    }

    private async identifySlackSimulation(
        content: string,
        teamId: string,
    ): Promise<{ campaignId: string } | null> {
        // Check for Slack simulation indicators
        const simulationIndicators = [
            '🚨 [TRAINING SIM]',
            'training simulation',
            'phishing simulation',
            'security awareness',
        ];

        const hasIndicator = simulationIndicators.some(indicator =>
            content.toLowerCase().includes(indicator.toLowerCase())
        );

        if (hasIndicator) {
            return {
                campaignId: 'slack-simulation-' + Date.now(),
            };
        }

        return null;
    }

    private async identifyTeamsSimulation(
        content: string,
        orgId: string,
    ): Promise<{ campaignId: string } | null> {
        // Similar to Slack simulation detection
        const simulationIndicators = [
            'training simulation',
            'phishing test',
            'security awareness',
            '[TRAINING]',
        ];

        const hasIndicator = simulationIndicators.some(indicator =>
            content.toLowerCase().includes(indicator.toLowerCase())
        );

        if (hasIndicator) {
            return {
                campaignId: 'teams-simulation-' + Date.now(),
            };
        }

        return null;
    }

    private async identifyGenericSimulation(
        webhookData: any,
        orgId: string,
    ): Promise<{ campaignId: string } | null> {
        // Generic simulation detection
        const content = JSON.stringify(webhookData).toLowerCase();

        if (content.includes('simulation') || content.includes('training')) {
            return {
                campaignId: webhookData.campaign_id || 'generic-simulation-' + Date.now(),
            };
        }

        return null;
    }

    private generateCoachingMessage(context: string): string {
        const messages = {
            outlook_report_success: `
🎉 Excellent work! You correctly identified and reported a phishing simulation.

Key points:
• You followed proper security protocols
• Reporting suspicious emails protects everyone
• Your vigilance helps strengthen our security posture

Keep up the great work! You're becoming a human firewall.
      `,
            gmail_report_success: `
✅ Perfect response! You successfully identified this training simulation.

What you did right:
• Trusted your instincts about suspicious content
• Used the proper reporting mechanism
• Helped protect your organization

Continue this vigilant approach with all suspicious emails!
      `,
        };

        return messages[context] || 'Great job reporting suspicious content!';
    }

    private async forwardToSecurityTeam(
        reportData: any,
        source: string,
        orgId: string,
    ): Promise<void> {
        // In a real implementation, this would:
        // 1. Send email to security team
        // 2. Create ticket in security system
        // 3. Log to SIEM
        // 4. Trigger automated analysis

        console.log(`Forwarding ${source} report to security team for org ${orgId}:`, {
            source,
            orgId,
            reportData: JSON.stringify(reportData, null, 2),
            timestamp: new Date().toISOString(),
        });

        // Example: Send to security team email
        // await this.emailService.sendSecurityAlert({
        //   to: 'security@organization.com',
        //   subject: `Phishing Report from ${source}`,
        //   body: this.formatSecurityAlert(reportData, source),
        // });
    }

    private formatSecurityAlert(reportData: any, source: string): string {
        return `
Security Alert: Phishing Report Received

Source: ${source}
Timestamp: ${new Date().toISOString()}

Report Details:
${JSON.stringify(reportData, null, 2)}

Please investigate this reported content for potential security threats.

This report was generated automatically by the AI Defense Trainer system.
    `;
    }
}
