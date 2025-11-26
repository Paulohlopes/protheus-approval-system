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
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { CreateWorkflowSimpleDto } from './dto/create-workflow-simple.dto';
import { RegistrationStatus } from '@prisma/client';

@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  // ==========================================
  // WORKFLOW CONFIGURATION
  // ==========================================

  @Post('workflows')
  createWorkflow(@Body() dto: CreateWorkflowSimpleDto) {
    return this.registrationService.createWorkflowSimple(dto);
  }

  @Get('workflows/template/:templateId')
  getActiveWorkflow(@Param('templateId') templateId: string) {
    return this.registrationService.getActiveWorkflow(templateId);
  }

  // ==========================================
  // REGISTRATION REQUESTS
  // ==========================================

  /**
   * Create draft registration
   */
  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    // TODO: Get user email from JWT
    const userEmail = 'user@example.com';
    return this.registrationService.create(dto, userEmail);
  }

  /**
   * Get all registrations (with optional filters)
   */
  @Get()
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

  /**
   * Get pending approvals for current user
   */
  @Get('pending-approval')
  getPendingApprovals(@Query('approverId') approverId: string) {
    // TODO: Get approverId from JWT
    return this.registrationService.getPendingApprovals(approverId);
  }

  /**
   * Get registration by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationService.findOne(id);
  }

  /**
   * Update draft registration
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRegistrationDto) {
    return this.registrationService.update(id, dto);
  }

  /**
   * Delete registration (DRAFT only)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrationService.remove(id);
  }

  // ==========================================
  // WORKFLOW ACTIONS
  // ==========================================

  /**
   * Submit registration for approval
   */
  @Post(':id/submit')
  submit(@Param('id') id: string) {
    return this.registrationService.submit(id);
  }

  /**
   * Approve registration
   */
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveRegistrationDto) {
    // TODO: Get approverId from JWT
    dto.approverId = dto.approverId || 'user-id-from-jwt';
    return this.registrationService.approve(id, dto);
  }

  /**
   * Reject registration
   */
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectRegistrationDto) {
    // TODO: Get approverId from JWT
    dto.approverId = dto.approverId || 'user-id-from-jwt';
    return this.registrationService.reject(id, dto);
  }

  /**
   * Retry sync to Protheus
   */
  @Post(':id/retry-sync')
  retrySync(@Param('id') id: string) {
    return this.registrationService.retrySync(id);
  }
}
