import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrationStatus, ApprovalAction } from '@prisma/client';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { CreateWorkflowSimpleDto } from './dto/create-workflow-simple.dto';
import { ProtheusIntegrationService } from '../protheus-integration/protheus-integration.service';
import { ApprovalGroupsService } from '../approval-groups/approval-groups.service';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly protheusIntegrationService: ProtheusIntegrationService,
    private readonly approvalGroupsService: ApprovalGroupsService,
  ) {}

  // ==========================================
  // WORKFLOW CONFIGURATION
  // ==========================================

  /**
   * Create workflow configuration (simple version with emails)
   */
  async createWorkflowSimple(dto: CreateWorkflowSimpleDto) {
    this.logger.log(`Creating workflow for template ${dto.templateId}`);

    // Check if template exists
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // Find all users by email
    const emails = dto.steps.map((step) => step.approverEmail);
    const users = await this.prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
    });

    // Create email to user ID mapping
    const emailToUserId = new Map(users.map((user) => [user.email, user.id]));

    // Validate all emails were found
    const missingEmails = emails.filter((email) => !emailToUserId.has(email));
    if (missingEmails.length > 0) {
      throw new BadRequestException(
        `Users not found for emails: ${missingEmails.join(', ')}`,
      );
    }

    // Convert steps to levels
    // Group by stepOrder to support multiple approvers per level
    const levelMap = new Map<number, string[]>();
    dto.steps.forEach((step) => {
      const userId = emailToUserId.get(step.approverEmail);
      if (userId) {
        const existing = levelMap.get(step.stepOrder) || [];
        existing.push(userId);
        levelMap.set(step.stepOrder, existing);
      }
    });

    // Create workflow with levels
    const workflow = await this.prisma.registrationWorkflow.create({
      data: {
        templateId: dto.templateId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        requiresSequentialApproval: dto.requiresSequentialApproval ?? true,
        levels: {
          create: Array.from(levelMap.entries()).map(([order, approverIds]) => ({
            levelOrder: order,
            levelName: dto.steps.find((s) => s.stepOrder === order)?.approverRole || `Nível ${order}`,
            approverIds,
            isParallel: !dto.requiresSequentialApproval,
          })),
        },
      },
      include: {
        levels: {
          orderBy: { levelOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Created workflow ${workflow.id} with ${workflow.levels.length} levels`);
    return workflow;
  }

  /**
   * Create workflow configuration (advanced version with levels)
   */
  async createWorkflow(dto: CreateWorkflowDto) {
    this.logger.log(`Creating workflow for template ${dto.templateId}`);

    // Check if template exists
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // Create workflow with levels
    const workflow = await this.prisma.registrationWorkflow.create({
      data: {
        templateId: dto.templateId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        requiresSequentialApproval: true, // Advanced workflow - will be determined by levels
        routingRules: dto.routingRules,
        levels: {
          create: dto.levels.map((level) => ({
            levelOrder: level.levelOrder,
            levelName: level.levelName,
            approverIds: level.approverIds,
            isParallel: level.isParallel ?? false,
            conditions: level.conditions,
          })),
        },
      },
      include: {
        levels: {
          orderBy: { levelOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Created workflow ${workflow.id} with ${workflow.levels.length} levels`);
    return workflow;
  }

  /**
   * Get active workflow for a template
   */
  async getActiveWorkflow(templateId: string) {
    const workflow = await this.prisma.registrationWorkflow.findFirst({
      where: {
        templateId,
        isActive: true,
      },
      include: {
        levels: {
          orderBy: { levelOrder: 'asc' },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`No active workflow found for template ${templateId}`);
    }

    return workflow;
  }

  // ==========================================
  // REGISTRATION REQUEST CRUD
  // ==========================================

  /**
   * Create draft registration
   */
  async create(dto: CreateRegistrationDto, userId: string, userEmail: string) {
    this.logger.log(`Creating registration draft for template ${dto.templateId} by user ${userId}`);

    // Validate user info from JWT
    if (!userId || !userEmail) {
      throw new BadRequestException('User information is missing. Please re-authenticate.');
    }

    // Get template with fields for validation
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: dto.templateId },
      include: {
        fields: {
          where: { isVisible: true, isEnabled: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // Validate formData against template fields
    const validationErrors = this.validateFormData(dto.formData, template.fields);
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Form validation failed',
        errors: validationErrors,
      });
    }

    // Create registration with userId from JWT (secure)
    const registration = await this.prisma.registrationRequest.create({
      data: {
        templateId: dto.templateId,
        tableName: template.tableName,
        requestedById: userId, // From JWT - secure
        requestedByEmail: userEmail,
        formData: dto.formData,
        status: RegistrationStatus.DRAFT,
        currentLevel: 1,
      },
      include: {
        template: true,
      },
    });

    this.logger.log(`Created registration draft ${registration.id}`);
    return registration;
  }

  /**
   * Validate form data against template fields
   */
  private validateFormData(
    formData: Record<string, any>,
    fields: Array<{ sx3FieldName: string; label: string; isRequired: boolean; fieldType: string; metadata?: any }>,
  ): string[] {
    const errors: string[] = [];

    fields.forEach((field) => {
      const value = formData[field.sx3FieldName];

      // Check required fields
      if (field.isRequired) {
        if (value === null || value === undefined || value === '') {
          errors.push(`${field.label} é obrigatório`);
          return;
        }
      }

      // Type validation
      if (value !== null && value !== undefined && value !== '') {
        switch (field.fieldType) {
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${field.label} deve ser um número válido`);
            }
            break;
          case 'date':
            if (typeof value === 'string') {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                errors.push(`${field.label} deve ser uma data válida`);
              }
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${field.label} deve ser verdadeiro ou falso`);
            }
            break;
        }

        // Max length validation
        if (field.metadata?.size && typeof value === 'string' && value.length > field.metadata.size) {
          errors.push(`${field.label} deve ter no máximo ${field.metadata.size} caracteres`);
        }
      }
    });

    return errors;
  }

  /**
   * Update draft registration
   */
  async update(id: string, dto: UpdateRegistrationDto, userId: string) {
    // Check if exists and is DRAFT
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
    }

    // Ownership check - only owner can update
    if (registration.requestedById !== userId) {
      throw new ForbiddenException('You can only update your own registrations');
    }

    if (registration.status !== RegistrationStatus.DRAFT) {
      throw new BadRequestException('Can only update DRAFT registrations');
    }

    return this.prisma.registrationRequest.update({
      where: { id },
      data: {
        formData: dto.formData,
      },
    });
  }

  /**
   * Find all registrations (with filters)
   */
  async findAll(filters?: {
    status?: RegistrationStatus;
    requestedById?: string;
    templateId?: string;
  }) {
    return this.prisma.registrationRequest.findMany({
      where: filters,
      include: {
        template: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            approvals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find one registration
   */
  async findOne(id: string) {
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            fields: {
              where: { isVisible: true },
              orderBy: { fieldOrder: 'asc' },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            level: 'asc',
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
    }

    return registration;
  }

  /**
   * Delete registration (only DRAFT)
   */
  async remove(id: string, userId: string) {
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
    }

    // Ownership check - only owner can delete
    if (registration.requestedById !== userId) {
      throw new ForbiddenException('You can only delete your own registrations');
    }

    if (registration.status !== RegistrationStatus.DRAFT) {
      throw new BadRequestException('Can only delete DRAFT registrations');
    }

    return this.prisma.registrationRequest.delete({
      where: { id },
    });
  }

  // ==========================================
  // WORKFLOW STATE MACHINE
  // ==========================================

  /**
   * Resolve all approver IDs for a workflow level (individual + group members)
   */
  private async resolveApproversForLevel(level: { approverIds: string[]; approverGroupIds?: string[] }): Promise<string[]> {
    // Start with individual approvers
    const allApprovers = new Set<string>(level.approverIds || []);

    // Add group members if groups are configured
    if (level.approverGroupIds && level.approverGroupIds.length > 0) {
      const groupMemberIds = await this.approvalGroupsService.getUserIdsFromGroups(level.approverGroupIds);
      groupMemberIds.forEach(id => allApprovers.add(id));
    }

    return [...allApprovers];
  }

  /**
   * Submit registration for approval
   * DRAFT → PENDING_APPROVAL
   */
  async submit(id: string) {
    this.logger.log(`Submitting registration ${id} for approval`);

    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
    }

    if (registration.status !== RegistrationStatus.DRAFT) {
      throw new BadRequestException('Can only submit DRAFT registrations');
    }

    // Get active workflow
    const workflow = await this.getActiveWorkflow(registration.templateId);

    // Get first level approvers
    const firstLevel = workflow.levels.find((l) => l.levelOrder === 1);
    if (!firstLevel) {
      throw new BadRequestException('Workflow has no levels configured');
    }

    // Resolve all approvers (individual + group members)
    const approverIds = await this.resolveApproversForLevel(firstLevel);

    if (approverIds.length === 0) {
      throw new BadRequestException('No approvers configured for first level');
    }

    // Update registration status and create approval records
    const updated = await this.prisma.registrationRequest.update({
      where: { id },
      data: {
        status: RegistrationStatus.PENDING_APPROVAL,
        currentLevel: 1,
        workflowSnapshot: workflow as any,
        approvals: {
          create: approverIds.map((approverId) => ({
            level: 1,
            approverId,
            approverEmail: '', // TODO: Get from user
            action: ApprovalAction.PENDING,
          })),
        },
      },
      include: {
        approvals: true,
      },
    });

    this.logger.log(`Registration ${id} submitted. Created ${updated.approvals.length} approval records`);

    // TODO: Send email notifications to approvers

    return updated;
  }

  /**
   * Validate and apply field changes during approval
   */
  private async applyFieldChanges(
    registrationId: string,
    formData: Record<string, any>,
    changes: Record<string, any>,
    editableFields: string[],
    userId: string,
    approvalLevel: number,
  ): Promise<Record<string, any>> {
    const updatedFormData = { ...formData };
    const changeHistory: Array<{
      requestId: string;
      fieldName: string;
      previousValue: string | null;
      newValue: string | null;
      changedById: string;
      approvalLevel: number;
    }> = [];

    for (const [fieldName, newValue] of Object.entries(changes)) {
      // Validate field is editable at this level
      if (!editableFields.includes(fieldName)) {
        throw new BadRequestException(`Field "${fieldName}" is not editable at this approval level`);
      }

      const previousValue = formData[fieldName];

      // Only record change if value is different
      if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
        changeHistory.push({
          requestId: registrationId,
          fieldName,
          previousValue: previousValue !== undefined ? JSON.stringify(previousValue) : null,
          newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
          changedById: userId,
          approvalLevel,
        });

        updatedFormData[fieldName] = newValue;
      }
    }

    // Save change history
    if (changeHistory.length > 0) {
      await this.prisma.fieldChangeHistory.createMany({
        data: changeHistory,
      });

      this.logger.log(`Recorded ${changeHistory.length} field changes for registration ${registrationId}`);
    }

    return updatedFormData;
  }

  /**
   * Get editable fields for current level from workflow snapshot
   */
  private getEditableFieldsForLevel(workflowSnapshot: any, levelOrder: number): string[] {
    const level = workflowSnapshot?.levels?.find((l: any) => l.levelOrder === levelOrder);
    return level?.editableFields || [];
  }

  /**
   * Approve registration at current level
   */
  async approve(id: string, dto: ApproveRegistrationDto, approverId: string) {
    this.logger.log(`Approving registration ${id} by user ${approverId}`);

    const registration = await this.findOne(id);

    if (
      registration.status !== RegistrationStatus.PENDING_APPROVAL &&
      registration.status !== RegistrationStatus.IN_APPROVAL
    ) {
      throw new BadRequestException('Registration is not pending approval');
    }

    // Find pending approval for this user at current level
    const approval = registration.approvals.find(
      (a) =>
        a.approverId === approverId &&
        a.level === registration.currentLevel &&
        a.action === ApprovalAction.PENDING,
    );

    if (!approval) {
      throw new BadRequestException('No pending approval found for this user at current level');
    }

    // Process field changes if provided
    if (dto.fieldChanges && Object.keys(dto.fieldChanges).length > 0) {
      const editableFields = this.getEditableFieldsForLevel(
        registration.workflowSnapshot,
        registration.currentLevel,
      );

      const updatedFormData = await this.applyFieldChanges(
        id,
        registration.formData as Record<string, any>,
        dto.fieldChanges,
        editableFields,
        approverId,
        registration.currentLevel,
      );

      // Update registration with new form data
      await this.prisma.registrationRequest.update({
        where: { id },
        data: { formData: updatedFormData },
      });
    }

    // Mark as approved
    await this.prisma.registrationApproval.update({
      where: { id: approval.id },
      data: {
        action: ApprovalAction.APPROVED,
        comments: dto.comments,
        actionAt: new Date(),
      },
    });

    // Check if level is complete
    const levelComplete = await this.isLevelComplete(id, registration.currentLevel);

    if (levelComplete) {
      await this.advanceToNextLevel(id);
    } else {
      // Update status to IN_APPROVAL if not already
      if (registration.status !== RegistrationStatus.IN_APPROVAL) {
        await this.prisma.registrationRequest.update({
          where: { id },
          data: { status: RegistrationStatus.IN_APPROVAL },
        });
      }
    }

    this.logger.log(`Registration ${id} approved by ${approverId}`);

    return this.findOne(id);
  }

  /**
   * Reject registration
   */
  async reject(id: string, dto: RejectRegistrationDto, approverId: string) {
    this.logger.log(`Rejecting registration ${id} by user ${approverId}`);

    const registration = await this.findOne(id);

    if (
      registration.status !== RegistrationStatus.PENDING_APPROVAL &&
      registration.status !== RegistrationStatus.IN_APPROVAL
    ) {
      throw new BadRequestException('Registration is not pending approval');
    }

    // Find pending approval for this user at current level
    const approval = registration.approvals.find(
      (a) =>
        a.approverId === approverId &&
        a.level === registration.currentLevel &&
        a.action === ApprovalAction.PENDING,
    );

    if (!approval) {
      throw new BadRequestException('No pending approval found for this user at current level');
    }

    // Mark as rejected
    await this.prisma.registrationApproval.update({
      where: { id: approval.id },
      data: {
        action: ApprovalAction.REJECTED,
        comments: dto.reason,
        actionAt: new Date(),
      },
    });

    // Update registration status to REJECTED
    await this.prisma.registrationRequest.update({
      where: { id },
      data: {
        status: RegistrationStatus.REJECTED,
      },
    });

    this.logger.log(`Registration ${id} rejected by ${approverId}`);

    // TODO: Send notification to requester

    return this.findOne(id);
  }

  /**
   * Check if current level is complete (all approvers approved)
   */
  private async isLevelComplete(registrationId: string, level: number): Promise<boolean> {
    const pendingCount = await this.prisma.registrationApproval.count({
      where: {
        requestId: registrationId,
        level,
        action: ApprovalAction.PENDING,
      },
    });

    return pendingCount === 0;
  }

  /**
   * Advance to next level or complete workflow
   */
  private async advanceToNextLevel(id: string) {
    const registration = await this.findOne(id);
    const workflow = registration.workflowSnapshot as any;

    const nextLevel = workflow.levels.find(
      (l: any) => l.levelOrder === registration.currentLevel + 1,
    );

    if (nextLevel) {
      // Has next level - resolve all approvers (individual + group members)
      this.logger.log(`Advancing registration ${id} to level ${nextLevel.levelOrder}`);

      const approverIds = await this.resolveApproversForLevel(nextLevel);

      if (approverIds.length === 0) {
        this.logger.warn(`No approvers for level ${nextLevel.levelOrder}, skipping to next`);
        // Recursively advance if no approvers at this level
        await this.prisma.registrationRequest.update({
          where: { id },
          data: { currentLevel: nextLevel.levelOrder },
        });
        return this.advanceToNextLevel(id);
      }

      await this.prisma.registrationRequest.update({
        where: { id },
        data: {
          currentLevel: nextLevel.levelOrder,
          status: RegistrationStatus.IN_APPROVAL,
          approvals: {
            create: approverIds.map((approverId: string) => ({
              level: nextLevel.levelOrder,
              approverId,
              approverEmail: '', // TODO: Get from user
              action: ApprovalAction.PENDING,
            })),
          },
        },
      });

      // TODO: Send notifications to next level approvers
    } else {
      // No next level - workflow complete
      this.logger.log(`Registration ${id} approved - all levels complete`);

      await this.prisma.registrationRequest.update({
        where: { id },
        data: {
          status: RegistrationStatus.APPROVED,
        },
      });

      // Trigger sync to Protheus
      try {
        await this.protheusIntegrationService.syncToProtheus(id);
      } catch (error) {
        this.logger.error(`Failed to sync registration ${id} to Protheus`, error);
        // Error is already logged in ProtheusIntegrationService
      }
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(approverId: string) {
    const approvals = await this.prisma.registrationApproval.findMany({
      where: {
        approverId,
        action: ApprovalAction.PENDING,
      },
      include: {
        request: {
          include: {
            template: true,
            requestedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return approvals.map((a) => a.request);
  }

  /**
   * Retry sync to Protheus
   */
  async retrySync(id: string) {
    const registration = await this.findOne(id);

    if (registration.status !== RegistrationStatus.SYNC_FAILED) {
      throw new BadRequestException('Can only retry failed syncs');
    }

    await this.prisma.registrationRequest.update({
      where: { id },
      data: {
        status: RegistrationStatus.APPROVED,
        syncError: null,
        syncLog: null,
      },
    });

    // Trigger sync to Protheus
    await this.protheusIntegrationService.syncToProtheus(id);

    return this.findOne(id);
  }

  // ==========================================
  // FIELD CHANGE HISTORY
  // ==========================================

  /**
   * Get field change history for a registration
   */
  async getFieldChangeHistory(registrationId: string) {
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${registrationId} not found`);
    }

    return this.prisma.fieldChangeHistory.findMany({
      where: { requestId: registrationId },
      include: {
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { approvalLevel: 'asc' },
        { changedAt: 'asc' },
      ],
    });
  }

  /**
   * Get editable fields info for a registration at its current level
   */
  async getEditableFieldsInfo(registrationId: string) {
    const registration = await this.findOne(registrationId);

    if (
      registration.status !== RegistrationStatus.PENDING_APPROVAL &&
      registration.status !== RegistrationStatus.IN_APPROVAL
    ) {
      return { editableFields: [], currentLevel: registration.currentLevel };
    }

    const editableFields = this.getEditableFieldsForLevel(
      registration.workflowSnapshot,
      registration.currentLevel,
    );

    return {
      editableFields,
      currentLevel: registration.currentLevel,
    };
  }
}
