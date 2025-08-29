import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @ApiOperation({ summary: 'Get API status' })
    @ApiResponse({ status: 200, description: 'API is running' })
    getStatus(): { message: string; version: string; timestamp: string } {
        return this.appService.getStatus();
    }
}
