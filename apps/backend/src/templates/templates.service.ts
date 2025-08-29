import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
    constructor(
        @InjectRepository(Template)
        private templatesRepository: Repository<Template>,
    ) { }

    async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
        const template = this.templatesRepository.create(createTemplateDto);
        return this.templatesRepository.save(template);
    }

    async findAll(organizationId: string): Promise<Template[]> {
        return this.templatesRepository.find({
            where: [
                { organizationId },
                { isPublic: true }
            ],
            relations: ['organization'],
        });
    }

    async findOne(id: string): Promise<Template> {
        const template = await this.templatesRepository.findOne({
            where: { id },
            relations: ['organization'],
        });

        if (!template) {
            throw new NotFoundException(`Template with ID ${id} not found`);
        }

        return template;
    }

    async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<Template> {
        await this.templatesRepository.update(id, updateTemplateDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.templatesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Template with ID ${id} not found`);
        }
    }
}
