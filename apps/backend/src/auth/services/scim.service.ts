import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';

export interface ScimUser {
    id?: string;
    userName: string;
    name: {
        givenName: string;
        familyName: string;
    };
    emails: Array<{
        value: string;
        primary: boolean;
    }>;
    active: boolean;
    groups?: string[];
    meta?: {
        resourceType: string;
        created?: string;
        lastModified?: string;
    };
}

export interface ScimGroup {
    id?: string;
    displayName: string;
    members: Array<{
        value: string;
        display: string;
    }>;
    meta?: {
        resourceType: string;
        created?: string;
        lastModified?: string;
    };
}

@Injectable()
export class ScimService {
    constructor(
        private usersService: UsersService,
        private organizationsService: OrganizationsService,
    ) { }

    // SCIM User Operations
    async createUser(scimUser: ScimUser, organizationId: string): Promise<ScimUser> {
        const primaryEmail = scimUser.emails.find(email => email.primary)?.value || scimUser.emails[0]?.value;

        if (!primaryEmail) {
            throw new ConflictException('User must have at least one email address');
        }

        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(primaryEmail);
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const createUserDto: CreateUserDto = {
            email: primaryEmail,
            firstName: scimUser.name.givenName,
            lastName: scimUser.name.familyName,
            roles: this.mapGroupsToRoles(scimUser.groups || []),
            organizationId,
        };

        const user = await this.usersService.create(createUserDto);

        return this.mapUserToScim(user);
    }

    async getUser(userId: string): Promise<ScimUser> {
        const user = await this.usersService.findOne(userId);
        return this.mapUserToScim(user);
    }

    async updateUser(userId: string, scimUser: Partial<ScimUser>): Promise<ScimUser> {
        const updateUserDto: UpdateUserDto = {};

        if (scimUser.name) {
            updateUserDto.firstName = scimUser.name.givenName;
            updateUserDto.lastName = scimUser.name.familyName;
        }

        if (scimUser.emails) {
            const primaryEmail = scimUser.emails.find(email => email.primary)?.value;
            if (primaryEmail) {
                updateUserDto.email = primaryEmail;
            }
        }

        if (scimUser.groups) {
            updateUserDto.roles = this.mapGroupsToRoles(scimUser.groups);
        }

        const user = await this.usersService.update(userId, updateUserDto);
        return this.mapUserToScim(user);
    }

    async deleteUser(userId: string): Promise<void> {
        await this.usersService.remove(userId);
    }

    async listUsers(organizationId: string, startIndex = 1, count = 100): Promise<{
        schemas: string[];
        totalResults: number;
        startIndex: number;
        itemsPerPage: number;
        Resources: ScimUser[];
    }> {
        const users = await this.usersService.findAll(organizationId);
        const startIdx = startIndex - 1;
        const endIdx = startIdx + count;
        const paginatedUsers = users.slice(startIdx, endIdx);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: users.length,
            startIndex,
            itemsPerPage: paginatedUsers.length,
            Resources: paginatedUsers.map(user => this.mapUserToScim(user)),
        };
    }

    // SCIM Group Operations
    async createGroup(scimGroup: ScimGroup, organizationId: string): Promise<ScimGroup> {
        // For now, groups are just role mappings
        // In a full implementation, you might have a separate Groups entity
        return {
            id: `group-${Date.now()}`,
            displayName: scimGroup.displayName,
            members: scimGroup.members,
            meta: {
                resourceType: 'Group',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
            },
        };
    }

    async getGroup(groupId: string): Promise<ScimGroup> {
        // Placeholder implementation
        throw new NotFoundException('Group not found');
    }

    async updateGroup(groupId: string, scimGroup: Partial<ScimGroup>): Promise<ScimGroup> {
        // Placeholder implementation
        throw new NotFoundException('Group not found');
    }

    async deleteGroup(groupId: string): Promise<void> {
        // Placeholder implementation
        throw new NotFoundException('Group not found');
    }

    // Helper methods
    private mapUserToScim(user: any): ScimUser {
        return {
            id: user.id,
            userName: user.email,
            name: {
                givenName: user.firstName,
                familyName: user.lastName,
            },
            emails: [
                {
                    value: user.email,
                    primary: true,
                },
            ],
            active: user.isActive,
            groups: user.roles,
            meta: {
                resourceType: 'User',
                created: user.createdAt,
                lastModified: user.updatedAt,
            },
        };
    }

    private mapGroupsToRoles(groups: string[]): string[] {
        // Map SCIM groups to internal roles
        const roleMapping: Record<string, string> = {
            'Administrators': 'admin',
            'Managers': 'manager',
            'Analysts': 'analyst',
            'Users': 'user',
        };

        return groups.map(group => roleMapping[group] || 'user');
    }
}
