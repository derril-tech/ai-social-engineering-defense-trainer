import { Injectable, OnModuleInit } from '@nestjs/common';
import { newEnforcer, Enforcer } from 'casbin';
import * as path from 'path';

@Injectable()
export class CasbinService implements OnModuleInit {
    private enforcer: Enforcer;

    async onModuleInit() {
        const modelPath = path.join(__dirname, '../../../config/rbac_model.conf');
        const policyPath = path.join(__dirname, '../../../config/rbac_policy.csv');

        this.enforcer = await newEnforcer(modelPath, policyPath);
    }

    async enforce(sub: string, obj: string, act: string): Promise<boolean> {
        return this.enforcer.enforce(sub, obj, act);
    }

    async addPolicy(sub: string, obj: string, act: string): Promise<boolean> {
        return this.enforcer.addPolicy(sub, obj, act);
    }

    async removePolicy(sub: string, obj: string, act: string): Promise<boolean> {
        return this.enforcer.removePolicy(sub, obj, act);
    }

    async addRoleForUser(user: string, role: string): Promise<boolean> {
        return this.enforcer.addRoleForUser(user, role);
    }

    async deleteRoleForUser(user: string, role: string): Promise<boolean> {
        return this.enforcer.deleteRoleForUser(user, role);
    }

    async getRolesForUser(user: string): Promise<string[]> {
        return this.enforcer.getRolesForUser(user);
    }
}
