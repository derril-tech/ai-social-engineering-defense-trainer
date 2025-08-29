import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ScimService, ScimUser, ScimGroup } from '../services/scim.service';
import { ScimAuthGuard } from '../guards/scim-auth.guard';

@ApiTags('SCIM')
@ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for SCIM API access',
})
@UseGuards(ScimAuthGuard)
@Controller('scim/v2')
export class ScimController {
    constructor(private scimService: ScimService) { }

    // Users endpoint
    @Get('Users')
    @ApiOperation({ summary: 'List users (SCIM)' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    async getUsers(
        @Query('startIndex') startIndex = 1,
        @Query('count') count = 100,
        @Query('filter') filter?: string,
        @Request() req,
    ) {
        const organizationId = req.organization.id;
        return this.scimService.listUsers(organizationId, startIndex, count);
    }

    @Get('Users/:id')
    @ApiOperation({ summary: 'Get user by ID (SCIM)' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    async getUser(@Param('id') id: string) {
        return this.scimService.getUser(id);
    }

    @Post('Users')
    @ApiOperation({ summary: 'Create user (SCIM)' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    async createUser(@Body() scimUser: ScimUser, @Request() req) {
        const organizationId = req.organization.id;
        return this.scimService.createUser(scimUser, organizationId);
    }

    @Put('Users/:id')
    @ApiOperation({ summary: 'Update user (SCIM)' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    async updateUser(@Param('id') id: string, @Body() scimUser: Partial<ScimUser>) {
        return this.scimService.updateUser(id, scimUser);
    }

    @Delete('Users/:id')
    @ApiOperation({ summary: 'Delete user (SCIM)' })
    @ApiResponse({ status: 204, description: 'User deleted successfully' })
    async deleteUser(@Param('id') id: string) {
        await this.scimService.deleteUser(id);
        return { status: 204 };
    }

    // Groups endpoint
    @Get('Groups')
    @ApiOperation({ summary: 'List groups (SCIM)' })
    @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
    async getGroups(
        @Query('startIndex') startIndex = 1,
        @Query('count') count = 100,
        @Request() req,
    ) {
        // Placeholder implementation
        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 0,
            startIndex,
            itemsPerPage: 0,
            Resources: [],
        };
    }

    @Get('Groups/:id')
    @ApiOperation({ summary: 'Get group by ID (SCIM)' })
    @ApiResponse({ status: 200, description: 'Group retrieved successfully' })
    async getGroup(@Param('id') id: string) {
        return this.scimService.getGroup(id);
    }

    @Post('Groups')
    @ApiOperation({ summary: 'Create group (SCIM)' })
    @ApiResponse({ status: 201, description: 'Group created successfully' })
    async createGroup(@Body() scimGroup: ScimGroup, @Request() req) {
        const organizationId = req.organization.id;
        return this.scimService.createGroup(scimGroup, organizationId);
    }

    @Put('Groups/:id')
    @ApiOperation({ summary: 'Update group (SCIM)' })
    @ApiResponse({ status: 200, description: 'Group updated successfully' })
    async updateGroup(@Param('id') id: string, @Body() scimGroup: Partial<ScimGroup>) {
        return this.scimService.updateGroup(id, scimGroup);
    }

    @Delete('Groups/:id')
    @ApiOperation({ summary: 'Delete group (SCIM)' })
    @ApiResponse({ status: 204, description: 'Group deleted successfully' })
    async deleteGroup(@Param('id') id: string) {
        await this.scimService.deleteGroup(id);
        return { status: 204 };
    }

    // Schema endpoints
    @Get('Schemas')
    @ApiOperation({ summary: 'Get SCIM schemas' })
    @ApiResponse({ status: 200, description: 'Schemas retrieved successfully' })
    async getSchemas() {
        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 2,
            startIndex: 1,
            itemsPerPage: 2,
            Resources: [
                {
                    id: 'urn:ietf:params:scim:schemas:core:2.0:User',
                    name: 'User',
                    description: 'User Account',
                    attributes: [
                        {
                            name: 'userName',
                            type: 'string',
                            required: true,
                            description: 'Unique identifier for the User',
                        },
                        {
                            name: 'name',
                            type: 'complex',
                            required: false,
                            description: 'The components of the user\'s real name',
                        },
                        {
                            name: 'emails',
                            type: 'complex',
                            multiValued: true,
                            required: false,
                            description: 'Email addresses for the user',
                        },
                    ],
                },
                {
                    id: 'urn:ietf:params:scim:schemas:core:2.0:Group',
                    name: 'Group',
                    description: 'Group',
                    attributes: [
                        {
                            name: 'displayName',
                            type: 'string',
                            required: true,
                            description: 'A human-readable name for the Group',
                        },
                        {
                            name: 'members',
                            type: 'complex',
                            multiValued: true,
                            required: false,
                            description: 'A list of members of the Group',
                        },
                    ],
                },
            ],
        };
    }

    @Get('ResourceTypes')
    @ApiOperation({ summary: 'Get SCIM resource types' })
    @ApiResponse({ status: 200, description: 'Resource types retrieved successfully' })
    async getResourceTypes() {
        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 2,
            startIndex: 1,
            itemsPerPage: 2,
            Resources: [
                {
                    id: 'User',
                    name: 'User',
                    endpoint: '/Users',
                    description: 'User Account',
                    schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
                },
                {
                    id: 'Group',
                    name: 'Group',
                    endpoint: '/Groups',
                    description: 'Group',
                    schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
                },
            ],
        };
    }

    @Get('ServiceProviderConfig')
    @ApiOperation({ summary: 'Get SCIM service provider configuration' })
    @ApiResponse({ status: 200, description: 'Service provider config retrieved successfully' })
    async getServiceProviderConfig() {
        return {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
            patch: {
                supported: true,
            },
            bulk: {
                supported: false,
                maxOperations: 0,
                maxPayloadSize: 0,
            },
            filter: {
                supported: true,
                maxResults: 200,
            },
            changePassword: {
                supported: false,
            },
            sort: {
                supported: false,
            },
            etag: {
                supported: false,
            },
            authenticationSchemes: [
                {
                    name: 'OAuth Bearer Token',
                    description: 'Authentication scheme using the OAuth Bearer Token Standard',
                    specUri: 'http://www.rfc-editor.org/info/rfc6750',
                    type: 'oauthbearertoken',
                },
            ],
        };
    }
}
