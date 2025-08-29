import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Client, Issuer } from 'openid-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
    constructor(private configService: ConfigService) {
        const issuerUrl = configService.get<string>('OIDC_ISSUER_URL');
        const clientId = configService.get<string>('OIDC_CLIENT_ID');
        const clientSecret = configService.get<string>('OIDC_CLIENT_SECRET');
        const redirectUri = configService.get<string>('OIDC_REDIRECT_URI');

        super({
            client: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [redirectUri],
                response_types: ['code'],
            },
            issuer: issuerUrl,
            authorizationURL: `${issuerUrl}/auth`,
            tokenURL: `${issuerUrl}/token`,
            userInfoURL: `${issuerUrl}/userinfo`,
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL: redirectUri,
            scope: 'openid profile email',
        });
    }

    async validate(tokenSet: any, userInfo: any): Promise<any> {
        const { email, given_name, family_name, sub } = userInfo;

        return {
            id: sub,
            email: email,
            firstName: given_name || '',
            lastName: family_name || '',
            provider: 'oidc',
        };
    }
}
