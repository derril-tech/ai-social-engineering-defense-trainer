import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template } from './entities/template.entity';
import { CasbinService } from '../common/services/casbin.service';

@Module({
    imports: [TypeOrmModule.forFeature([Template])],
    controllers: [TemplatesController],
    providers: [TemplatesService, CasbinService],
    exports: [TemplatesService],
})
export class TemplatesModule { }
