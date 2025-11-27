import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class ApprovalGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // GROUP OPERATIONS
  // ==========================================

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.approvalGroup.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                department: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.approvalGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                department: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Approval group with ID ${id} not found`);
    }

    return group;
  }

  async create(dto: CreateGroupDto, addedById?: string) {
    // Check if group name already exists
    const existing = await this.prisma.approvalGroup.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Group with name "${dto.name}" already exists`);
    }

    return this.prisma.approvalGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateGroupDto) {
    // Check if group exists
    const group = await this.prisma.approvalGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Approval group with ID ${id} not found`);
    }

    // Check if new name conflicts with existing group
    if (dto.name && dto.name !== group.name) {
      const existing = await this.prisma.approvalGroup.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Group with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.approvalGroup.update({
      where: { id },
      data: dto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                department: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async remove(id: string) {
    const group = await this.prisma.approvalGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Approval group with ID ${id} not found`);
    }

    // Soft delete - just deactivate
    return this.prisma.approvalGroup.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    const group = await this.prisma.approvalGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Approval group with ID ${id} not found`);
    }

    // Hard delete - will cascade to members
    return this.prisma.approvalGroup.delete({
      where: { id },
    });
  }

  // ==========================================
  // MEMBER OPERATIONS
  // ==========================================

  async getMembers(groupId: string) {
    const group = await this.prisma.approvalGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Approval group with ID ${groupId} not found`);
    }

    return this.prisma.approvalGroupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            department: true,
            isActive: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addMember(groupId: string, userId: string, addedById?: string) {
    // Check if group exists
    const group = await this.prisma.approvalGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException(`Approval group with ID ${groupId} not found`);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if already a member
    const existingMember = await this.prisma.approvalGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(`User is already a member of this group`);
    }

    return this.prisma.approvalGroupMember.create({
      data: {
        groupId,
        userId,
        addedById,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            department: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async removeMember(groupId: string, userId: string) {
    // Check if membership exists
    const membership = await this.prisma.approvalGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException(`User is not a member of this group`);
    }

    return this.prisma.approvalGroupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get all user IDs that belong to the specified groups
   */
  async getUserIdsFromGroups(groupIds: string[]): Promise<string[]> {
    if (!groupIds || groupIds.length === 0) {
      return [];
    }

    const members = await this.prisma.approvalGroupMember.findMany({
      where: {
        groupId: { in: groupIds },
        group: { isActive: true },
        user: { isActive: true },
      },
      select: {
        userId: true,
      },
    });

    // Return unique user IDs
    return [...new Set(members.map(m => m.userId))];
  }

  /**
   * Check if a user is a member of any of the specified groups
   */
  async isUserInAnyGroup(userId: string, groupIds: string[]): Promise<boolean> {
    if (!groupIds || groupIds.length === 0) {
      return false;
    }

    const membership = await this.prisma.approvalGroupMember.findFirst({
      where: {
        userId,
        groupId: { in: groupIds },
        group: { isActive: true },
      },
    });

    return !!membership;
  }

  /**
   * Get groups that a user belongs to
   */
  async getUserGroups(userId: string) {
    return this.prisma.approvalGroupMember.findMany({
      where: {
        userId,
        group: { isActive: true },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }
}
