import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Post()
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Create a new campaign' })
    @ApiResponse({ status: 201, description: 'Campaign created successfully' })
    create(@Body() createCampaignDto: CreateCampaignDto, @Request() req) {
        return this.campaignsService.create({
            ...createCampaignDto,
            organizationId: req.user.organizationId,
        });
    }

    @Get()
    @Roles('admin', 'manager', 'analyst', 'user')
    @ApiOperation({ summary: 'Get all campaigns in organization' })
    @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
    findAll(@Request() req) {
        return this.campaignsService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Roles('admin', 'manager', 'analyst', 'user')
    @ApiOperation({ summary: 'Get campaign by ID' })
    @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
    findOne(@Param('id') id: string) {
        return this.campaignsService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Update campaign' })
    @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
    update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
        return this.campaignsService.update(id, updateCampaignDto);
    }

    @Delete(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Delete campaign' })
    @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
    remove(@Param('id') id: string) {
        return this.campaignsService.remove(id);
    }
}
