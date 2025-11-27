import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApprovalGroupsService } from './approval-groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInfo } from '../auth/interfaces/auth.interface';

@Controller('approval-groups')
export class ApprovalGroupsController {
  constructor(private readonly approvalGroupsService: ApprovalGroupsService) {}

  // ==========================================
  // GROUP ENDPOINTS
  // ==========================================

  /**
   * Get all approval groups
   */
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.approvalGroupsService.findAll(includeInactive === 'true');
  }

  /**
   * Get a specific approval group by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.approvalGroupsService.findOne(id);
  }

  /**
   * Create a new approval group
   */
  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: UserInfo) {
    return this.approvalGroupsService.create(dto, user?.id);
  }

  /**
   * Update an approval group
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.approvalGroupsService.update(id, dto);
  }

  /**
   * Delete (deactivate) an approval group
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.approvalGroupsService.remove(id);
  }

  // ==========================================
  // MEMBER ENDPOINTS
  // ==========================================

  /**
   * Get all members of a group
   */
  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.approvalGroupsService.getMembers(id);
  }

  /**
   * Add a member to a group
   */
  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: UserInfo,
  ) {
    return this.approvalGroupsService.addMember(id, dto.userId, user?.id);
  }

  /**
   * Remove a member from a group
   */
  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.approvalGroupsService.removeMember(id, userId);
  }

  // ==========================================
  // UTILITY ENDPOINTS
  // ==========================================

  /**
   * Get groups that the current user belongs to
   */
  @Get('user/my-groups')
  getMyGroups(@CurrentUser() user: UserInfo) {
    return this.approvalGroupsService.getUserGroups(user.id);
  }

  /**
   * Get groups that a specific user belongs to
   */
  @Get('user/:userId/groups')
  getUserGroups(@Param('userId') userId: string) {
    return this.approvalGroupsService.getUserGroups(userId);
  }
}
