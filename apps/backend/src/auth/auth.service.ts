import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: User) {
        const payload = {
            email: user.email,
            sub: user.id,
            organizationId: user.organizationId,
            roles: user.roles,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.roles,
                organizationId: user.organizationId,
            },
        };
    }

    async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        organizationId: string;
    }) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        const user = await this.usersService.create({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            organizationId: userData.organizationId,
            roles: ['user'], // Default role
        });

        // Update with password hash (separate to avoid exposing in DTO)
        await this.usersService.update(user.id, { passwordHash } as any);

        return this.login(user);
    }

    async refreshToken(user: User) {
        return this.login(user);
    }
}
