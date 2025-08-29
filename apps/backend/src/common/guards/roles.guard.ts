import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CasbinService } from '../services/casbin.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private casbinService: CasbinService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        // Check permissions using Casbin
        for (const role of requiredRoles) {
            const hasPermission = await this.casbinService.enforce(
                user.id,
                context.getHandler().name,
                role,
            );
            if (hasPermission) {
                return true;
            }
        }

        return false;
    }
}
