import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';

export const SKIP_MFA_KEY = 'skipMfa';
export const SkipMfa = () => Reflector.createDecorator<boolean>();

@Injectable()
export class MfaGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const skipMfa = this.reflector.getAllAndOverride<boolean>(SKIP_MFA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skipMfa) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        // Get full user details to check MFA status
        const fullUser = await this.usersService.findOne(user.id);

        // If MFA is not enabled for the user, allow access
        if (!fullUser.mfaEnabled) {
            return true;
        }

        // Check if MFA has been verified in this session
        const mfaVerified = request.session?.mfaVerified;
        const mfaVerifiedAt = request.session?.mfaVerifiedAt;

        if (!mfaVerified) {
            throw new UnauthorizedException('MFA verification required');
        }

        // Check if MFA verification is still valid (e.g., within last hour)
        const mfaValidityPeriod = 60 * 60 * 1000; // 1 hour in milliseconds
        const now = Date.now();

        if (now - mfaVerifiedAt > mfaValidityPeriod) {
            throw new UnauthorizedException('MFA verification expired');
        }

        return true;
    }
}
