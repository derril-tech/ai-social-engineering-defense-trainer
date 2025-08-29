import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectRepository(Organization)
        private organizationsRepository: Repository<Organization>,
    ) { }

    async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
        const organization = this.organizationsRepository.create(createOrganizationDto);
        return this.organizationsRepository.save(organization);
    }

    async findAll(): Promise<Organization[]> {
        return this.organizationsRepository.find({
            relations: ['users', 'campaigns', 'templates'],
        });
    }

    async findOne(id: string): Promise<Organization> {
        const organization = await this.organizationsRepository.findOne({
            where: { id },
            relations: ['users', 'campaigns', 'templates'],
        });

        if (!organization) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }

        return organization;
    }

    async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
        await this.organizationsRepository.update(id, updateOrganizationDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.organizationsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }
    }
}
