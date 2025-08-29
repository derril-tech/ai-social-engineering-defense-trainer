import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getStatus(): { message: string; version: string; timestamp: string } {
        return {
            message: 'AI Social Engineering Defense Trainer API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        };
    }
}
