import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsBoolean, IsUUID } from 'class-validator';
import { TemplateType, DifficultyLevel } from '../entities/template.entity';

export class CreateTemplateDto {
    @ApiProperty({ example: 'Urgent Security Update Required' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Phishing template simulating security update notification', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: TemplateType, example: TemplateType.EMAIL })
    @IsEnum(TemplateType)
    type: TemplateType;

    @ApiProperty({ enum: DifficultyLevel, example: DifficultyLevel.BEGINNER, required: false })
    @IsEnum(DifficultyLevel)
    @IsOptional()
    difficulty?: DifficultyLevel;

    @ApiProperty({ example: 'Dear {{firstName}}, urgent security update required...' })
    @IsString()
    content: string;

    @ApiProperty({ example: {}, required: false })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiProperty({ example: ['phishing', 'security', 'urgent'], required: false })
    @IsArray()
    @IsOptional()
    tags?: string[];

    @ApiProperty({ example: false, required: false })
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    organizationId?: string;
}
