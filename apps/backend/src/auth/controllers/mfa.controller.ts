import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MfaService } from '../services/mfa.service';
import { UsersService } from '../../users/users.service';
import { EnableMfaDto, VerifyMfaDto, DisableMfaDto } from '../dto/mfa.dto';

@ApiTags('MFA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/mfa')
export class MfaController {
    constructor(
        private mfaService: MfaService,
        private usersService: UsersService,
    ) { }

    @Post('setup')
    @ApiOperation({ summary: 'Setup MFA for user' })
    @ApiResponse({ status: 200, description: 'MFA setup initiated' })
    async setupMfa(@Request() req) {
        const user = await this.usersService.findOne(req.user.id);

        if (user.mfaEnabled) {
            throw new BadRequestException('MFA is already enabled for this user');
        }

        const { secret, qrCodeUrl, backupCodes } = this.mfaService.generateSecret(user.email);

        // Store the secret temporarily (not yet enabled)
        await this.usersService.update(user.id, {
            mfaSecret: secret,
            // Store backup codes securely (in real implementation, hash them)
            // For now, we'll store them in user metadata
        } as any);

        const qrCodeDataUrl = await this.mfaService.generateQRCode(qrCodeUrl);

        return {
            qrCode: qrCodeDataUrl,
            backupCodes,
            message: 'Scan the QR code with your authenticator app and verify with a token to enable MFA',
        };
    }

    @Post('enable')
    @ApiOperation({ summary: 'Enable MFA after verification' })
    @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
    async enableMfa(@Body() enableMfaDto: EnableMfaDto, @Request() req) {
        const user = await this.usersService.findOne(req.user.id);

        if (!user.mfaSecret) {
            throw new BadRequestException('MFA setup not initiated. Call /mfa/setup first');
        }

        if (user.mfaEnabled) {
            throw new BadRequestException('MFA is already enabled');
        }

        const isValid = this.mfaService.verifyToken(user.mfaSecret, enableMfaDto.token);

        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA token');
        }

        await this.usersService.update(user.id, { mfaEnabled: true } as any);

        return {
            message: 'MFA enabled successfully',
            backupCodes: enableMfaDto.backupCodes, // Return the backup codes one more time
        };
    }

    @Post('verify')
    @ApiOperation({ summary: 'Verify MFA token' })
    @ApiResponse({ status: 200, description: 'MFA token verified' })
    async verifyMfa(@Body() verifyMfaDto: VerifyMfaDto, @Request() req) {
        const user = await this.usersService.findOne(req.user.id);

        if (!user.mfaEnabled || !user.mfaSecret) {
            throw new BadRequestException('MFA is not enabled for this user');
        }

        let isValid = false;

        // Try TOTP token first
        if (verifyMfaDto.token) {
            isValid = this.mfaService.verifyToken(user.mfaSecret, verifyMfaDto.token);
        }

        // If TOTP fails, try backup code
        if (!isValid && verifyMfaDto.backupCode) {
            // In a real implementation, you'd retrieve and update backup codes from user data
            const userBackupCodes = []; // Retrieve from user metadata
            isValid = this.mfaService.verifyBackupCode(userBackupCodes, verifyMfaDto.backupCode);

            if (isValid) {
                // Update user with remaining backup codes
                await this.usersService.update(user.id, {
                    // Update backup codes in metadata
                } as any);
            }
        }

        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA token or backup code');
        }

        return {
            message: 'MFA verification successful',
            verified: true,
        };
    }

    @Post('disable')
    @ApiOperation({ summary: 'Disable MFA' })
    @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
    async disableMfa(@Body() disableMfaDto: DisableMfaDto, @Request() req) {
        const user = await this.usersService.findOne(req.user.id);

        if (!user.mfaEnabled) {
            throw new BadRequestException('MFA is not enabled for this user');
        }

        // Verify current password or MFA token before disabling
        const isValid = this.mfaService.verifyToken(user.mfaSecret, disableMfaDto.token);

        if (!isValid) {
            throw new UnauthorizedException('Invalid MFA token');
        }

        await this.usersService.update(user.id, {
            mfaEnabled: false,
            mfaSecret: null,
        } as any);

        return {
            message: 'MFA disabled successfully',
        };
    }

    @Get('status')
    @ApiOperation({ summary: 'Get MFA status' })
    @ApiResponse({ status: 200, description: 'MFA status retrieved' })
    async getMfaStatus(@Request() req) {
        const user = await this.usersService.findOne(req.user.id);

        return {
            enabled: user.mfaEnabled,
            hasBackupCodes: false, // Check if user has unused backup codes
        };
    }
}
