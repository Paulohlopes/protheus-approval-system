import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { CreateWorkflowSimpleDto } from './dto/create-workflow-simple.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { RegistrationStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInfo } from '../auth/interfaces/auth.interface';

@ApiTags('registrations')
@ApiBearerAuth('JWT-auth')
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  // ==========================================
  // WORKFLOW CONFIGURATION
  // ==========================================

  @Post('workflows')
  @ApiOperation({ summary: 'Criar workflow avançado', description: 'Cria um workflow de aprovação com níveis e condições' })
  @ApiResponse({ status: 201, description: 'Workflow criado com sucesso' })
  createWorkflow(@Body() dto: CreateWorkflowDto) {
    return this.registrationService.createWorkflow(dto);
  }

  @Post('workflows/simple')
  @ApiOperation({ summary: 'Criar workflow simples', description: 'Cria um workflow de aprovação baseado em emails' })
  @ApiResponse({ status: 201, description: 'Workflow criado com sucesso' })
  createWorkflowSimple(@Body() dto: CreateWorkflowSimpleDto) {
    return this.registrationService.createWorkflowSimple(dto);
  }

  @Get('workflows/template/:templateId')
  @ApiOperation({ summary: 'Obter workflow ativo', description: 'Retorna o workflow ativo para um template' })
  @ApiParam({ name: 'templateId', description: 'ID do template' })
  @ApiResponse({ status: 200, description: 'Workflow encontrado' })
  @ApiResponse({ status: 404, description: 'Workflow não encontrado' })
  getActiveWorkflow(@Param('templateId') templateId: string) {
    return this.registrationService.getActiveWorkflow(templateId);
  }

  // ==========================================
  // REGISTRATION REQUESTS
  // ==========================================

  @Post()
  @ApiOperation({ summary: 'Criar rascunho de cadastro', description: 'Cria uma nova solicitação de cadastro em modo rascunho' })
  @ApiResponse({ status: 201, description: 'Cadastro criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() dto: CreateRegistrationDto, @CurrentUser() user: UserInfo) {
    if (!user?.id || !user?.email) {
      throw new UnauthorizedException('User not authenticated properly');
    }
    return this.registrationService.create(dto, user.id, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cadastros', description: 'Lista todos os cadastros com filtros opcionais' })
  @ApiQuery({ name: 'status', required: false, enum: RegistrationStatus })
  @ApiQuery({ name: 'requestedById', required: false, description: 'Filtrar por solicitante' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Filtrar por template' })
  @ApiResponse({ status: 200, description: 'Lista de cadastros' })
  findAll(
    @Query('status') status?: RegistrationStatus,
    @Query('requestedById') requestedById?: string,
    @Query('templateId') templateId?: string,
  ) {
    return this.registrationService.findAll({
      status,
      requestedById,
      templateId,
    });
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Minhas solicitações', description: 'Lista as solicitações do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de solicitações do usuário' })
  getMyRequests(@CurrentUser() user: UserInfo) {
    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated properly');
    }
    return this.registrationService.findAll({ requestedById: user.id });
  }

  @Get('pending-approval')
  @ApiOperation({ summary: 'Aprovações pendentes', description: 'Lista cadastros pendentes de aprovação do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de aprovações pendentes' })
  getPendingApprovals(@CurrentUser() user: UserInfo) {
    return this.registrationService.getPendingApprovals(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cadastro', description: 'Retorna detalhes de um cadastro específico' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Detalhes do cadastro' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Cadastro não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserInfo) {
    return this.registrationService.findOne(id, user.id, user.isAdmin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar rascunho', description: 'Atualiza um cadastro em rascunho' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Cadastro atualizado' })
  @ApiResponse({ status: 400, description: 'Só é possível editar rascunhos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationDto,
    @CurrentUser() user: UserInfo,
  ) {
    return this.registrationService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir rascunho', description: 'Exclui um cadastro em rascunho' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Cadastro excluído' })
  @ApiResponse({ status: 400, description: 'Só é possível excluir rascunhos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string, @CurrentUser() user: UserInfo) {
    return this.registrationService.remove(id, user.id);
  }

  // ==========================================
  // WORKFLOW ACTIONS
  // ==========================================

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submeter para aprovação', description: 'Submete o cadastro para o fluxo de aprovação' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Cadastro submetido com sucesso' })
  @ApiResponse({ status: 400, description: 'Cadastro não pode ser submetido' })
  submit(@Param('id') id: string, @CurrentUser() user: UserInfo) {
    return this.registrationService.submit(id, user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar cadastro', description: 'Aprova o cadastro no nível atual' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Cadastro aprovado' })
  @ApiResponse({ status: 400, description: 'Nenhuma aprovação pendente' })
  @ApiResponse({ status: 403, description: 'Não pode aprovar própria solicitação' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveRegistrationDto,
    @CurrentUser() user: UserInfo,
  ) {
    return this.registrationService.approve(id, dto, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar cadastro', description: 'Rejeita o cadastro com justificativa' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Cadastro rejeitado' })
  @ApiResponse({ status: 400, description: 'Nenhuma aprovação pendente' })
  @ApiResponse({ status: 403, description: 'Não pode rejeitar própria solicitação' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectRegistrationDto,
    @CurrentUser() user: UserInfo,
  ) {
    return this.registrationService.reject(id, dto, user.id);
  }

  @Post(':id/retry-sync')
  @ApiOperation({ summary: 'Reprocessar sincronização', description: 'Tenta sincronizar novamente com Protheus' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Sincronização iniciada' })
  @ApiResponse({ status: 400, description: 'Só é possível reprocessar falhas' })
  retrySync(@Param('id') id: string) {
    return this.registrationService.retrySync(id);
  }

  // ==========================================
  // FIELD CHANGE HISTORY
  // ==========================================

  /**
   * Get field change history for a registration
   */
  @Get(':id/field-changes')
  getFieldChangeHistory(@Param('id') id: string) {
    return this.registrationService.getFieldChangeHistory(id);
  }

  /**
   * Get editable fields info for current approval level
   */
  @Get(':id/editable-fields')
  getEditableFieldsInfo(@Param('id') id: string) {
    return this.registrationService.getEditableFieldsInfo(id);
  }

  // ==========================================
  // LOG-03: STUCK WORKFLOW DETECTION AND ADMIN OVERRIDE
  // ==========================================

  /**
   * Check if a registration's workflow is stuck
   */
  @Get(':id/stuck-status')
  checkWorkflowStuckStatus(@Param('id') id: string) {
    return this.registrationService.checkWorkflowStuckStatus(id);
  }

  /**
   * Get all stuck workflows (admin only)
   */
  @Get('admin/stuck-workflows')
  getStuckWorkflows(@CurrentUser() user: UserInfo) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only administrators can view stuck workflows');
    }
    return this.registrationService.getStuckWorkflows();
  }

  /**
   * Admin override to advance a stuck workflow
   */
  @Post(':id/admin-override')
  adminOverrideAdvance(
    @Param('id') id: string,
    @Body() dto: { action: 'force_approve' | 'skip_level'; comments?: string },
    @CurrentUser() user: UserInfo,
  ) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only administrators can perform workflow overrides');
    }
    return this.registrationService.adminOverrideAdvance(id, user.id, dto.action, dto.comments);
  }
}
