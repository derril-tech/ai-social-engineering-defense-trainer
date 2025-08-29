import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
    constructor(
        @InjectRepository(Campaign)
        private campaignsRepository: Repository<Campaign>,
    ) { }

    async create(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
        const campaign = this.campaignsRepository.create(createCampaignDto);
        return this.campaignsRepository.save(campaign);
    }

    async findAll(organizationId: string): Promise<Campaign[]> {
        return this.campaignsRepository.find({
            where: { organizationId },
            relations: ['organization', 'template'],
        });
    }

    async findOne(id: string): Promise<Campaign> {
        const campaign = await this.campaignsRepository.findOne({
            where: { id },
            relations: ['organization', 'template'],
        });

        if (!campaign) {
            throw new NotFoundException(`Campaign with ID ${id} not found`);
        }

        return campaign;
    }

    async update(id: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
        await this.campaignsRepository.update(id, updateCampaignDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.campaignsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Campaign with ID ${id} not found`);
        }
    }
}
