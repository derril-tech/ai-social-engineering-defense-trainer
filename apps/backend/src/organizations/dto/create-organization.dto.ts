import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateOrganizationDto {
    @ApiProperty({ example: 'Acme Corporation' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'acme.com', required: false })
    @IsString()
    @IsOptional()
    domain?: string;

    @ApiProperty({ example: {}, required: false })
    @IsObject()
    @IsOptional()
    settings?: Record<string, any>;

    @ApiProperty({ example: 'enterprise', required: false })
    @IsString()
    @IsOptional()
    subscriptionTier?: string;
}
