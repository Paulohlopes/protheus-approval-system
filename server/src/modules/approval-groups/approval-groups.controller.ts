import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApprovalGroupsService } from './approval-groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInfo } from '../auth/interfaces/auth.interface';
import { RolesGuard, Roles, Role, AdminOnly } from '../auth/guards/roles.guard';

@ApiTags('approval-groups')
@ApiBearerAuth('JWT-auth')
@Controller('approval-groups')
export class ApprovalGroupsController {
  constructor(private readonly approvalGroupsService: ApprovalGroupsService) {}

  // ==========================================
  // GROUP ENDPOINTS
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'Listar grupos', description: 'Lista todos os grupos de aprovação' })
  @ApiQuery({ name: 'includeInactive', required: false, description: 'Incluir grupos inativos' })
  @ApiResponse({ status: 200, description: 'Lista de grupos' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.approvalGroupsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter grupo', description: 'Retorna detalhes de um grupo específico' })
  @ApiParam({ name: 'id', description: 'ID do grupo' })
  @ApiResponse({ status: 200, description: 'Detalhes do grupo' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado' })
  findOne(@Param('id') id: string) {
    return this.approvalGroupsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar grupo', description: 'Cria um novo grupo de aprovação' })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso' })
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: UserInfo) {
    return this.approvalGroupsService.create(dto, user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar grupo', description: 'Atualiza um grupo de aprovação' })
  @ApiParam({ name: 'id', description: 'ID do grupo' })
  @ApiResponse({ status: 200, description: 'Grupo atualizado' })
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.approvalGroupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar grupo', description: 'Desativa um grupo de aprovação' })
  @ApiParam({ name: 'id', description: 'ID do grupo' })
  @ApiResponse({ status: 200, description: 'Grupo desativado' })
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
   * Get all users (for selection dropdowns)
   * SEC-07: Restricted to admins only
   */
  @Get('users/all')
  @UseGuards(RolesGuard)
  @AdminOnly()
  getAllUsers(@CurrentUser() user: UserInfo) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only administrators can view all users');
    }
    return this.approvalGroupsService.getAllUsers();
  }

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
