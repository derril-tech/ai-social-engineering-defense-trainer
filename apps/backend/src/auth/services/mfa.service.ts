import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
    constructor(private configService: ConfigService) { }

    generateSecret(userEmail: string): { secret: string; qrCodeUrl: string; backupCodes: string[] } {
        const secret = speakeasy.generateSecret({
            name: userEmail,
            issuer: 'AI Defense Trainer',
            length: 32,
        });

        const qrCodeUrl = speakeasy.otpauthURL({
            secret: secret.ascii,
            label: userEmail,
            issuer: 'AI Defense Trainer',
            encoding: 'ascii',
        });

        // Generate backup codes
        const backupCodes = this.generateBackupCodes();

        return {
            secret: secret.base32,
            qrCodeUrl,
            backupCodes,
        };
    }

    async generateQRCode(otpauthUrl: string): Promise<string> {
        return QRCode.toDataURL(otpauthUrl);
    }

    verifyToken(secret: string, token: string): boolean {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2, // Allow 2 time steps (60 seconds) of drift
        });
    }

    verifyBackupCode(userBackupCodes: string[], providedCode: string): boolean {
        const index = userBackupCodes.indexOf(providedCode);
        if (index !== -1) {
            // Remove used backup code
            userBackupCodes.splice(index, 1);
            return true;
        }
        return false;
    }

    private generateBackupCodes(): string[] {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(this.generateRandomCode());
        }
        return codes;
    }

    private generateRandomCode(): string {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
}
