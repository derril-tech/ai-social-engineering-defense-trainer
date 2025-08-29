import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-saml';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
    constructor(private configService: ConfigService) {
        super({
            entryPoint: configService.get<string>('SAML_ENTRY_POINT'),
            issuer: configService.get<string>('SAML_ISSUER'),
            cert: configService.get<string>('SAML_CERT'),
            callbackUrl: configService.get<string>('SAML_CALLBACK_URL'),
            authnRequestBinding: 'HTTP-POST',
            identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
            signatureAlgorithm: 'sha256',
        });
    }

    async validate(profile: any): Promise<any> {
        const { nameID, email, firstName, lastName, organizationId } = profile;

        return {
            email: email || nameID,
            firstName: firstName || '',
            lastName: lastName || '',
            organizationId: organizationId,
            provider: 'saml',
        };
    }
}
