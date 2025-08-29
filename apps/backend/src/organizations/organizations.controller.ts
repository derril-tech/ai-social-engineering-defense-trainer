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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Create a new organization' })
    @ApiResponse({ status: 201, description: 'Organization created successfully' })
    create(@Body() createOrganizationDto: CreateOrganizationDto) {
        return this.organizationsService.create(createOrganizationDto);
    }

    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'Get all organizations' })
    @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
    findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Get organization by ID' })
    @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
    findOne(@Param('id') id: string, @Request() req) {
        // Users can only access their own organization unless they're admin
        const targetId = req.user.roles.includes('admin') ? id : req.user.organizationId;
        return this.organizationsService.findOne(targetId);
    }

    @Patch(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Update organization' })
    @ApiResponse({ status: 200, description: 'Organization updated successfully' })
    update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto, @Request() req) {
        const targetId = req.user.roles.includes('admin') ? id : req.user.organizationId;
        return this.organizationsService.update(targetId, updateOrganizationDto);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Delete organization' })
    @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
    remove(@Param('id') id: string) {
        return this.organizationsService.remove(id);
    }
}
