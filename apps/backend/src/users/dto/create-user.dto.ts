import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: ['user'], required: false })
    @IsArray()
    @IsOptional()
    roles?: string[];

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    organizationId?: string;
}
