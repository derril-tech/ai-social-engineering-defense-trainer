import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SamlStrategy } from './strategies/saml.strategy';
import { OidcStrategy } from './strategies/oidc.strategy';
import { MfaService } from './services/mfa.service';
import { ScimService } from './services/scim.service';
import { SsoController } from './controllers/sso.controller';
import { MfaController } from './controllers/mfa.controller';
import { ScimController } from './controllers/scim.controller';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { CasbinService } from '../common/services/casbin.service';

@Module({
    imports: [
        UsersModule,
        OrganizationsModule,
        PassportModule,
        JwtModule.registerAsync({
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController, SsoController, MfaController, ScimController],
    providers: [
        AuthService,
        MfaService,
        ScimService,
        LocalStrategy,
        JwtStrategy,
        SamlStrategy,
        OidcStrategy,
        CasbinService,
    ],
    exports: [AuthService, MfaService, ScimService],
})
export class AuthModule { }
