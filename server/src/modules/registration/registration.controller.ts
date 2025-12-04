import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  UnauthorizedException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { SendBackRegistrationDto } from './dto/send-back-registration.dto';
import { CreateWorkflowSimpleDto } from './dto/create-workflow-simple.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { CreateAlterationDto } from './dto/create-alteration.dto';
import { CreateBulkRegistrationDto, BulkSubmitDto } from './dto/bulk-import.dto';
import { RegistrationStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInfo } from '../auth/interfaces/auth.interface';
import { BulkImportService } from './services/bulk-import.service';

@ApiTags('registrations')
@ApiBearerAuth('JWT-auth')
@Controller('registrations')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly bulkImportService: BulkImportService,
  ) {}

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
  // BULK IMPORT
  // ==========================================

  @Get('bulk/template/:templateId')
  @ApiOperation({
    summary: 'Baixar modelo para importação em lote',
    description: 'Gera e retorna um arquivo Excel ou CSV para preenchimento em lote',
  })
  @ApiParam({ name: 'templateId', description: 'ID do template' })
  @ApiQuery({ name: 'format', enum: ['xlsx', 'csv'], required: false, description: 'Formato do arquivo (padrão: xlsx)' })
  @ApiResponse({ status: 200, description: 'Arquivo modelo gerado' })
  @ApiResponse({ status: 403, description: 'Template não permite importação em lote' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async downloadBulkTemplate(
    @Param('templateId') templateId: string,
    @Query('format') format: 'xlsx' | 'csv' = 'xlsx',
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.bulkImportService.generateTemplate(templateId, format);

    const contentType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';
    const extension = format === 'xlsx' ? 'xlsx' : 'csv';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="template-bulk-${templateId}.${extension}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post('bulk/validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Validar arquivo para importação em lote',
    description: 'Valida o arquivo antes de criar a solicitação. Retorna erros e preview dos dados.',
  })
  @ApiResponse({ status: 200, description: 'Validação concluída' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  async validateBulkImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('templateId') templateId: string,
  ) {
    const parsedData = await this.bulkImportService.parseFile(file);
    return this.bulkImportService.validateBulkData(templateId, parsedData);
  }

  @Post('bulk/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Criar solicitação de cadastro em lote',
    description: 'Cria uma solicitação com múltiplos itens a partir do arquivo importado',
  })
  @ApiResponse({ status: 201, description: 'Solicitação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Template não permite importação em lote' })
  async createBulkRegistration(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateBulkRegistrationDto,
    @CurrentUser() user: UserInfo,
    @Headers('x-country-id') countryIdHeader?: string,
  ) {
    if (!user?.id || !user?.email) {
      throw new UnauthorizedException('User not authenticated properly');
    }

    // Use country from header if not in body
    if (!dto.countryId && countryIdHeader) {
      dto.countryId = countryIdHeader;
    }

    return this.bulkImportService.createBulkRegistration(dto, file, user.id, user.email);
  }

  @Post('bulk/submit')
  @ApiOperation({
    summary: 'Submeter múltiplas solicitações',
    description: 'Submete várias solicitações em rascunho para aprovação de uma vez',
  })
  @ApiResponse({ status: 200, description: 'Solicitações submetidas' })
  async submitBulkRegistrations(
    @Body() dto: BulkSubmitDto,
    @CurrentUser() user: UserInfo,
  ) {
    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated properly');
    }

    // For each registration, call the submit method
    const results = [];
    for (const id of dto.registrationIds) {
      try {
        const result = await this.registrationService.submit(id, user.id);
        results.push({
          registrationId: id,
          success: true,
          trackingNumber: result?.trackingNumber,
        });
      } catch (error: any) {
        results.push({
          registrationId: id,
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      totalRequested: dto.registrationIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ==========================================
  // REGISTRATION REQUESTS
  // ==========================================

  @Post()
  @ApiOperation({ summary: 'Criar rascunho de cadastro', description: 'Cria uma nova solicitação de cadastro em modo rascunho' })
  @ApiResponse({ status: 201, description: 'Cadastro criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() dto: CreateRegistrationDto,
    @CurrentUser() user: UserInfo,
    @Headers('x-country-id') countryIdHeader?: string,
  ) {
    if (!user?.id || !user?.email) {
      throw new UnauthorizedException('User not authenticated properly');
    }
    // Use country from header if not in body
    if (!dto.countryId && countryIdHeader) {
      dto.countryId = countryIdHeader;
    }
    return this.registrationService.create(dto, user.id, user.email);
  }

  @Post('alteration')
  @ApiOperation({ summary: 'Criar rascunho de alteração', description: 'Cria um rascunho para alteração de um registro existente no Protheus' })
  @ApiResponse({ status: 201, description: 'Rascunho de alteração criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado no Protheus' })
  createAlteration(
    @Body() dto: CreateAlterationDto,
    @CurrentUser() user: UserInfo,
    @Headers('x-country-id') countryIdHeader?: string,
  ) {
    if (!user?.id || !user?.email) {
      throw new UnauthorizedException('User not authenticated properly');
    }
    // Use country from header if not in body
    if (!dto.countryId && countryIdHeader) {
      dto.countryId = countryIdHeader;
    }
    return this.registrationService.createAlterationDraft(dto, user.id, user.email);
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

  @Post(':id/send-back')
  @ApiOperation({ summary: 'Devolver cadastro', description: 'Devolve o cadastro para nível anterior ou para o solicitante (rascunho)' })
  @ApiParam({ name: 'id', description: 'ID do cadastro' })
  @ApiResponse({ status: 200, description: 'Cadastro devolvido' })
  @ApiResponse({ status: 400, description: 'Nenhuma aprovação pendente ou nível inválido' })
  @ApiResponse({ status: 403, description: 'Não pode devolver própria solicitação' })
  sendBack(
    @Param('id') id: string,
    @Body() dto: SendBackRegistrationDto,
    @CurrentUser() user: UserInfo,
  ) {
    return this.registrationService.sendBack(id, dto, user.id);
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
