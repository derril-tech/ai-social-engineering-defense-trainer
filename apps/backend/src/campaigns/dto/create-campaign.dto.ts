import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsUUID, IsDateString } from 'class-validator';
import { CampaignType, CampaignStatus } from '../entities/campaign.entity';

export class CreateCampaignDto {
    @ApiProperty({ example: 'Q1 Security Awareness Campaign' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Quarterly phishing simulation for all employees', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: CampaignType, example: CampaignType.EMAIL })
    @IsEnum(CampaignType)
    type: CampaignType;

    @ApiProperty({ enum: CampaignStatus, example: CampaignStatus.DRAFT, required: false })
    @IsEnum(CampaignStatus)
    @IsOptional()
    status?: CampaignStatus;

    @ApiProperty({ example: {}, required: false })
    @IsObject()
    @IsOptional()
    configuration?: Record<string, any>;

    @ApiProperty({ example: '2024-01-15T09:00:00Z', required: false })
    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;

    @ApiProperty({ example: 'uuid-of-template' })
    @IsUUID()
    templateId: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    organizationId?: string;
}
