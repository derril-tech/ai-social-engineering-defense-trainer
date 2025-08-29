import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        };
    }

    getReadiness() {
        // TODO: Add actual health checks for database, redis, etc.
        return {
            status: 'ready',
            checks: {
                database: 'ok',
                redis: 'ok',
                nats: 'ok',
            },
        };
    }
}
