import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationsService } from '../../organizations/organizations.service';

@Injectable()
export class ScimAuthGuard implements CanActivate {
    constructor(
        private configService: ConfigService,
        private organizationsService: OrganizationsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);

        // In a real implementation, you'd validate the SCIM token
        // and determine which organization it belongs to
        const isValidToken = await this.validateScimToken(token);

        if (!isValidToken) {
            throw new UnauthorizedException('Invalid SCIM token');
        }

        // Attach organization to request for SCIM operations
        const organizationId = await this.getOrganizationFromToken(token);
        const organization = await this.organizationsService.findOne(organizationId);

        request.organization = organization;

        return true;
    }

    private async validateScimToken(token: string): Promise<boolean> {
        // Implement SCIM token validation logic
        // This could be a JWT, API key, or other token format

        // For now, check against configured SCIM tokens
        const validTokens = this.configService.get<string>('SCIM_TOKENS', '').split(',');
        return validTokens.includes(token);
    }

    private async getOrganizationFromToken(token: string): Promise<string> {
        // Extract organization ID from token
        // This is a simplified implementation

        // In a real implementation, you might decode a JWT or lookup in a database
        return this.configService.get<string>('DEFAULT_ORGANIZATION_ID', 'default-org');
    }
}
