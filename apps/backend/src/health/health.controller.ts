import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    getHealth() {
        return this.healthService.getHealth();
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is ready' })
    getReadiness() {
        return this.healthService.getReadiness();
    }
}
