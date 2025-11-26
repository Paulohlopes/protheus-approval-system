import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrationStatus, ApprovalAction } from '@prisma/client';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { CreateWorkflowSimpleDto } from './dto/create-workflow-simple.dto';
import { ProtheusIntegrationService } from '../protheus-integration/protheus-integration.service';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly protheusIntegrationService: ProtheusIntegrationService,
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
  async create(dto: CreateRegistrationDto, userEmail: string) {
    this.logger.log(`Creating registration draft for template ${dto.templateId}`);

    // Get template
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // TODO: Validate formData against template fields
    // For now, we'll skip validation

    // Create registration
    const registration = await this.prisma.registrationRequest.create({
      data: {
        templateId: dto.templateId,
        tableName: template.tableName,
        requestedById: dto.requestedById, // TODO: Get from JWT
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
   * Update draft registration
   */
  async update(id: string, dto: UpdateRegistrationDto) {
    // Check if exists and is DRAFT
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
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
  async remove(id: string) {
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
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

    // Update registration status and create approval records
    const updated = await this.prisma.registrationRequest.update({
      where: { id },
      data: {
        status: RegistrationStatus.PENDING_APPROVAL,
        currentLevel: 1,
        workflowSnapshot: workflow as any,
        approvals: {
          create: firstLevel.approverIds.map((approverId) => ({
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
   * Approve registration at current level
   */
  async approve(id: string, dto: ApproveRegistrationDto) {
    this.logger.log(`Approving registration ${id}`);

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
        a.approverId === dto.approverId &&
        a.level === registration.currentLevel &&
        a.action === ApprovalAction.PENDING,
    );

    if (!approval) {
      throw new BadRequestException('No pending approval found for this user at current level');
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

    this.logger.log(`Registration ${id} approved by ${dto.approverId}`);

    return this.findOne(id);
  }

  /**
   * Reject registration
   */
  async reject(id: string, dto: RejectRegistrationDto) {
    this.logger.log(`Rejecting registration ${id}`);

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
        a.approverId === dto.approverId &&
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

    this.logger.log(`Registration ${id} rejected by ${dto.approverId}`);

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
      // Has next level - create approval records
      this.logger.log(`Advancing registration ${id} to level ${nextLevel.levelOrder}`);

      await this.prisma.registrationRequest.update({
        where: { id },
        data: {
          currentLevel: nextLevel.levelOrder,
          status: RegistrationStatus.IN_APPROVAL,
          approvals: {
            create: nextLevel.approverIds.map((approverId: string) => ({
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
}
