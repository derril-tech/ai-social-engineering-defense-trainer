import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class EnableMfaDto {
    @ApiProperty({ example: '123456' })
    @IsString()
    token: string;

    @ApiProperty({ example: ['ABC123', 'DEF456'], required: false })
    @IsArray()
    @IsOptional()
    backupCodes?: string[];
}

export class VerifyMfaDto {
    @ApiProperty({ example: '123456', required: false })
    @IsString()
    @IsOptional()
    token?: string;

    @ApiProperty({ example: 'ABC123', required: false })
    @IsString()
    @IsOptional()
    backupCode?: string;
}

export class DisableMfaDto {
    @ApiProperty({ example: '123456' })
    @IsString()
    token: string;
}
