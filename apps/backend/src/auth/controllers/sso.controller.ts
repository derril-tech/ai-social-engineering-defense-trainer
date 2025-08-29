import {
    Controller,
    Get,
    Post,
    UseGuards,
    Req,
    Res,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { Request, Response } from 'express';

@ApiTags('SSO')
@Controller('auth/sso')
export class SsoController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    // SAML SSO
    @Get('saml/login')
    @UseGuards(AuthGuard('saml'))
    @ApiOperation({ summary: 'Initiate SAML SSO login' })
    async samlLogin() {
        // This will redirect to the SAML IdP
    }

    @Post('saml/callback')
    @UseGuards(AuthGuard('saml'))
    @ApiOperation({ summary: 'SAML SSO callback' })
    async samlCallback(@Req() req: Request, @Res() res: Response) {
        const { user } = req;

        // Find or create user
        let existingUser = await this.usersService.findByEmail(user.email);
        if (!existingUser) {
            existingUser = await this.usersService.create({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                organizationId: user.organizationId,
                roles: ['user'],
            });
        }

        const authResult = await this.authService.login(existingUser);

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${authResult.access_token}`);
    }

    // OIDC SSO
    @Get('oidc/login')
    @UseGuards(AuthGuard('oidc'))
    @ApiOperation({ summary: 'Initiate OIDC SSO login' })
    async oidcLogin() {
        // This will redirect to the OIDC provider
    }

    @Get('oidc/callback')
    @UseGuards(AuthGuard('oidc'))
    @ApiOperation({ summary: 'OIDC SSO callback' })
    async oidcCallback(@Req() req: Request, @Res() res: Response) {
        const { user } = req;

        // Find or create user
        let existingUser = await this.usersService.findByEmail(user.email);
        if (!existingUser) {
            // For OIDC, we need to determine the organization
            // This could be based on email domain or a query parameter
            const organizationId = this.determineOrganizationId(user.email);

            existingUser = await this.usersService.create({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                organizationId,
                roles: ['user'],
            });
        }

        const authResult = await this.authService.login(existingUser);

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${authResult.access_token}`);
    }

    private determineOrganizationId(email: string): string {
        // Extract domain from email and map to organization
        // This is a simplified implementation
        const domain = email.split('@')[1];

        // In a real implementation, you'd have a mapping table
        // For now, return a default organization ID
        return process.env.DEFAULT_ORGANIZATION_ID || 'default-org-id';
    }
}
