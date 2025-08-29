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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Post()
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Create a new template' })
    @ApiResponse({ status: 201, description: 'Template created successfully' })
    create(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
        return this.templatesService.create({
            ...createTemplateDto,
            organizationId: req.user.organizationId,
        });
    }

    @Get()
    @Roles('admin', 'manager', 'analyst', 'user')
    @ApiOperation({ summary: 'Get all templates (organization + public)' })
    @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
    findAll(@Request() req) {
        return this.templatesService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Roles('admin', 'manager', 'analyst', 'user')
    @ApiOperation({ summary: 'Get template by ID' })
    @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
    findOne(@Param('id') id: string) {
        return this.templatesService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Update template' })
    @ApiResponse({ status: 200, description: 'Template updated successfully' })
    update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
        return this.templatesService.update(id, updateTemplateDto);
    }

    @Delete(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Delete template' })
    @ApiResponse({ status: 200, description: 'Template deleted successfully' })
    remove(@Param('id') id: string) {
        return this.templatesService.remove(id);
    }
}
