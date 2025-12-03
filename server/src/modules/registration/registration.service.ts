import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrationStatus, ApprovalAction, Prisma } from '@prisma/client';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ApproveRegistrationDto } from './dto/approve-registration.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { SendBackRegistrationDto } from './dto/send-back-registration.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { CreateWorkflowSimpleDto } from './dto/create-workflow-simple.dto';
import { CreateAlterationDto } from './dto/create-alteration.dto';
import { ProtheusIntegrationService } from '../protheus-integration/protheus-integration.service';
import { ApprovalGroupsService } from '../approval-groups/approval-groups.service';
import { ProtheusDataService } from '../protheus-data/protheus-data.service';

// ==========================================
// LOG-08: STATE MACHINE - Valid Status Transitions
// ==========================================
const VALID_STATUS_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  [RegistrationStatus.DRAFT]: [RegistrationStatus.PENDING_APPROVAL],
  [RegistrationStatus.PENDING_APPROVAL]: [RegistrationStatus.IN_APPROVAL, RegistrationStatus.APPROVED, RegistrationStatus.REJECTED, RegistrationStatus.RETURNED],
  [RegistrationStatus.IN_APPROVAL]: [RegistrationStatus.APPROVED, RegistrationStatus.REJECTED, RegistrationStatus.RETURNED],
  [RegistrationStatus.APPROVED]: [RegistrationStatus.SYNCING_TO_PROTHEUS],
  [RegistrationStatus.REJECTED]: [], // Terminal state - no transitions allowed
  [RegistrationStatus.RETURNED]: [RegistrationStatus.DRAFT, RegistrationStatus.PENDING_APPROVAL], // Can be resubmitted or returned to draft
  [RegistrationStatus.SYNCING_TO_PROTHEUS]: [RegistrationStatus.SYNCED, RegistrationStatus.SYNC_FAILED],
  [RegistrationStatus.SYNCED]: [], // Terminal state - no transitions allowed
  [RegistrationStatus.SYNC_FAILED]: [RegistrationStatus.APPROVED], // Can retry sync
};

/**
 * Validates if a status transition is allowed
 */
function isValidTransition(from: RegistrationStatus, to: RegistrationStatus): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[from];
  return allowedTransitions?.includes(to) ?? false;
}

/**
 * Validates and throws if transition is invalid
 */
function validateStatusTransition(from: RegistrationStatus, to: RegistrationStatus, context?: string): void {
  if (!isValidTransition(from, to)) {
    throw new BadRequestException(
      `Invalid status transition from ${from} to ${to}${context ? ` (${context})` : ''}`
    );
  }
}

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly protheusIntegrationService: ProtheusIntegrationService,
    private readonly approvalGroupsService: ApprovalGroupsService,
    private readonly protheusDataService: ProtheusDataService,
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

    // Deactivate any existing active workflows for this template
    await this.prisma.registrationWorkflow.updateMany({
      where: {
        templateId: dto.templateId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

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
            approverIds: level.approverIds || [],
            approverGroupIds: level.approverGroupIds || [],
            editableFields: level.editableFields || [],
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

  /**
   * Enrich workflow with approver and group names for snapshot storage
   * @param workflow - The workflow to enrich
   * @param prismaClient - Optional Prisma client (use for transactions)
   */
  private async enrichWorkflowWithNames(workflow: any, prismaClient?: any) {
    const db = prismaClient || this.prisma;

    // Collect all unique approver IDs and group IDs
    const allApproverIds = new Set<string>();
    const allGroupIds = new Set<string>();

    for (const level of workflow.levels) {
      if (level.approverIds) {
        level.approverIds.forEach((id: string) => allApproverIds.add(id));
      }
      if (level.approverGroupIds) {
        level.approverGroupIds.forEach((id: string) => allGroupIds.add(id));
      }
    }

    // Fetch all users and groups in batch
    // Cast column to text to avoid UUID type mismatch with Prisma string parameters
    let users: { id: string; name: string; email: string }[] = [];
    if (allApproverIds.size > 0) {
      const userIds = Array.from(allApproverIds);
      users = await db.$queryRaw(
        Prisma.sql`SELECT id, name, email FROM users WHERE id::text IN (${Prisma.join(userIds)})`
      );
    }

    let groups: { id: string; name: string; description: string | null }[] = [];
    if (allGroupIds.size > 0) {
      const groupIds = Array.from(allGroupIds);
      groups = await db.$queryRaw(
        Prisma.sql`SELECT id, name, description FROM approval_groups WHERE id::text IN (${Prisma.join(groupIds)})`
      );

      // Fetch group members separately
      const groupMembersRaw: { groupId: string; userId: string; userName: string; userEmail: string }[] = await db.$queryRaw(
        Prisma.sql`
          SELECT agm."groupId", u.id as "userId", u.name as "userName", u.email as "userEmail"
          FROM approval_group_members agm
          INNER JOIN users u ON agm."userId" = u.id
          WHERE agm."groupId"::text IN (${Prisma.join(groupIds)})
        `
      );

      // Attach members to groups
      groups = groups.map(g => ({
        ...g,
        members: groupMembersRaw
          .filter(m => m.groupId === g.id)
          .map(m => ({ user: { id: m.userId, name: m.userName, email: m.userEmail } }))
      })) as any;
    }

    // Create lookup maps with proper typing
    const userMap = new Map<string, { id: string; name: string; email: string }>(
      users.map((u) => [u.id, u])
    );
    const groupMap = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      members: { user: { id: string; name: string; email: string } }[];
    }>(groups.map((g: any) => [g.id, g]));

    // Enrich levels with names
    const enrichedLevels = workflow.levels.map((level: any) => ({
      ...level,
      // Add approvers with names
      approvers: (level.approverIds || []).map((id: string) => {
        const user = userMap.get(id);
        return user ? { id, name: user.name, email: user.email } : { id, name: 'Usuario desconhecido', email: '' };
      }),
      // Add groups with names and members
      approverGroups: (level.approverGroupIds || []).map((id: string) => {
        const group = groupMap.get(id);
        return group
          ? {
              id,
              name: group.name,
              description: group.description,
              members: group.members.map((m: any) => ({
                id: m.user.id,
                name: m.user.name,
                email: m.user.email
              }))
            }
          : { id, name: 'Grupo desconhecido', description: '', members: [] };
      }),
    }));

    return {
      ...workflow,
      levels: enrichedLevels,
    };
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
   * Create alteration draft (modification of existing Protheus record)
   */
  async createAlterationDraft(dto: CreateAlterationDto, userId: string, userEmail: string) {
    this.logger.log(`Creating alteration draft for template ${dto.templateId}, RECNO ${dto.originalRecno} by user ${userId}`);

    // Validate user info from JWT
    if (!userId || !userEmail) {
      throw new BadRequestException('User information is missing. Please re-authenticate.');
    }

    // Get template with fields and tables for validation
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: dto.templateId },
      include: {
        fields: {
          where: { isVisible: true, isEnabled: true },
        },
        tables: {
          orderBy: { tableOrder: 'asc' },
          include: {
            fields: {
              where: { isVisible: true, isEnabled: true },
            },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // Determine the table name to use for fetching original record
    let primaryTableName: string;
    let fieldsToValidate: typeof template.fields;

    if (template.isMultiTable && template.tables && template.tables.length > 0) {
      // For multi-table templates, use the parent table
      const parentTable = template.tables.find(t => t.relationType === 'parent');
      const searchTable = parentTable || template.tables[0];
      primaryTableName = searchTable.tableName;
      fieldsToValidate = searchTable.fields || [];
    } else {
      // For single-table templates, use template.tableName
      if (!template.tableName) {
        throw new BadRequestException('Template has no table configured');
      }
      primaryTableName = template.tableName;
      fieldsToValidate = template.fields;
    }

    // Fetch original record from Protheus
    const originalRecord = await this.protheusDataService.getRecordByRecno(
      primaryTableName,
      dto.originalRecno,
    );

    // Use provided formData or original data
    const formData = dto.formData || originalRecord.data;

    // Validate formData against template fields (skip validation for alteration drafts with original data)
    if (dto.formData) {
      const validationErrors = this.validateFormData(formData, fieldsToValidate);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Form validation failed',
          errors: validationErrors,
        });
      }
    }

    // Create registration with alteration type
    const registration = await this.prisma.registrationRequest.create({
      data: {
        templateId: dto.templateId,
        tableName: primaryTableName,
        requestedById: userId,
        requestedByEmail: userEmail,
        formData,
        operationType: 'ALTERATION',
        originalRecno: dto.originalRecno,
        originalFormData: originalRecord.data,
        status: RegistrationStatus.DRAFT,
        currentLevel: 1,
      },
      include: {
        template: true,
      },
    });

    this.logger.log(`Created alteration draft ${registration.id} for RECNO ${dto.originalRecno}`);
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
    const registrations = await this.prisma.registrationRequest.findMany({
      where: filters,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrich workflow snapshots with approver names
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (request) => {
        if (request.workflowSnapshot) {
          const snapshot = request.workflowSnapshot as any;
          const needsEnrichment = snapshot.levels?.some((level: any) => {
            const hasApproverIds = level.approverIds && level.approverIds.length > 0;
            const hasGroupIds = level.approverGroupIds && level.approverGroupIds.length > 0;
            const hasEnrichedApprovers = level.approvers && level.approvers.length > 0;
            const hasEnrichedGroups = level.approverGroups && level.approverGroups.length > 0;
            return (hasApproverIds && !hasEnrichedApprovers) || (hasGroupIds && !hasEnrichedGroups);
          });

          if (needsEnrichment) {
            const enrichedSnapshot = await this.enrichWorkflowWithNames(snapshot);
            return {
              ...request,
              workflowSnapshot: enrichedSnapshot,
            };
          }
        }
        return request;
      })
    );

    return enrichedRegistrations;
  }

  /**
   * SEC-06: Check if user has access to a registration
   * Access is granted if:
   * - User is the owner (requestedById)
   * - User is an approver in the workflow
   * - User is an admin
   */
  async checkRegistrationAccess(registration: any, userId: string, isAdmin: boolean): Promise<boolean> {
    // Admin can access all
    if (isAdmin) {
      return true;
    }

    // Owner can access
    if (registration.requestedById === userId) {
      return true;
    }

    // Approver can access
    const isApprover = registration.approvals?.some(
      (a: any) => a.approverId === userId
    );
    if (isApprover) {
      return true;
    }

    // Check if user is in any group that's part of the workflow
    if (registration.workflowSnapshot) {
      const snapshot = registration.workflowSnapshot as any;
      for (const level of snapshot.levels || []) {
        if (level.approverGroupIds && level.approverGroupIds.length > 0) {
          const groupMemberIds = await this.approvalGroupsService.getUserIdsFromGroups(level.approverGroupIds);
          if (groupMemberIds.includes(userId)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Find one registration
   */
  async findOne(id: string, userId?: string, isAdmin?: boolean) {
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

    // SEC-06: Check access if userId is provided
    if (userId !== undefined) {
      const hasAccess = await this.checkRegistrationAccess(registration, userId, isAdmin ?? false);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this registration');
      }
    }

    // Enrich workflow snapshot if it doesn't have approver names (for old registrations)
    if (registration.workflowSnapshot) {
      const snapshot = registration.workflowSnapshot as any;

      // Check if any level has approverIds or approverGroupIds but missing enriched data
      const needsEnrichment = snapshot.levels?.some((level: any) => {
        const hasApproverIds = level.approverIds && level.approverIds.length > 0;
        const hasGroupIds = level.approverGroupIds && level.approverGroupIds.length > 0;
        const hasEnrichedApprovers = level.approvers && level.approvers.length > 0;
        const hasEnrichedGroups = level.approverGroups && level.approverGroups.length > 0;

        // Needs enrichment if has IDs but no enriched data
        return (hasApproverIds && !hasEnrichedApprovers) || (hasGroupIds && !hasEnrichedGroups);
      });

      if (needsEnrichment) {
        const enrichedSnapshot = await this.enrichWorkflowWithNames(snapshot);
        return {
          ...registration,
          workflowSnapshot: enrichedSnapshot,
        };
      }
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
   * @param level - The workflow level
   * @param prismaClient - Optional Prisma client (use for transactions)
   */
  private async resolveApproversForLevel(
    level: { approverIds: string[]; approverGroupIds?: string[] },
    prismaClient?: any
  ): Promise<string[]> {
    const db = prismaClient || this.prisma;

    // Start with individual approvers
    const allApprovers = new Set<string>(level.approverIds || []);

    // Add group members if groups are configured
    if (level.approverGroupIds && level.approverGroupIds.length > 0) {
      // Cast column to text to avoid UUID type mismatch with Prisma string parameters
      const groupIds = level.approverGroupIds;
      const members: { userId: string }[] = await db.$queryRaw(
        Prisma.sql`
          SELECT DISTINCT agm."userId"
          FROM approval_group_members agm
          INNER JOIN approval_groups ag ON agm."groupId" = ag.id
          INNER JOIN users u ON agm."userId" = u.id
          WHERE agm."groupId"::text IN (${Prisma.join(groupIds)})
            AND ag."isActive" = true
            AND u."isActive" = true
        `
      );
      members.forEach((m: { userId: string }) => allApprovers.add(m.userId));
    }

    return [...allApprovers];
  }

  /**
   * Submit registration for approval
   * DRAFT → PENDING_APPROVAL
   * LOG-04: Uses transaction to ensure atomic state change
   * LOG-05: Validates all workflow levels have at least 1 approver
   */
  async submit(id: string, userId: string) {
    this.logger.log(`Submitting registration ${id} for approval`);

    // LOG-04: Use transaction for atomic submit operation
    return this.prisma.$transaction(async (tx) => {
      // Lock the registration row to prevent concurrent submissions
      // Cast column to text since Prisma uses text for UUID in schema without @db.Uuid
      const registrations = await tx.$queryRaw<any[]>(
        Prisma.sql`SELECT * FROM registration_requests WHERE id::text = ${id} FOR UPDATE`
      );
      const registration = registrations[0];

      if (!registration) {
        throw new NotFoundException(`Registration ${id} not found`);
      }

      // Note: Raw query returns snake_case column names from PostgreSQL
      const requestedById = registration.requested_by_id || registration.requestedById;
      const templateId = registration.template_id || registration.templateId;
      const currentStatus = registration.status as RegistrationStatus;

      // Ownership check - only owner can submit
      if (requestedById !== userId) {
        throw new ForbiddenException('You can only submit your own registrations');
      }

      // LOG-08: Validate state transition
      validateStatusTransition(
        currentStatus,
        RegistrationStatus.PENDING_APPROVAL,
        'submit'
      );

      // Get active workflow
      const workflow = await tx.registrationWorkflow.findFirst({
        where: {
          templateId: templateId,
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

      // LOG-05: Validate all levels have at least 1 approver
      for (const level of workflow.levels) {
        const approverIds = await this.resolveApproversForLevel(level, tx);
        if (approverIds.length === 0) {
          throw new BadRequestException(
            `Workflow level ${level.levelOrder} (${level.levelName || 'Unnamed'}) has no approvers configured. ` +
            `Please configure at least one approver or group for each level.`
          );
        }
      }

      // Enrich workflow with approver and group names for the snapshot
      // Pass tx to use the same transaction
      const enrichedWorkflow = await this.enrichWorkflowWithNames(workflow, tx);

      // Debug: log workflow being saved as snapshot
      this.logger.log(`Saving workflow snapshot with ${enrichedWorkflow.levels.length} levels:`,
        enrichedWorkflow.levels.map((l: any) => ({
          levelOrder: l.levelOrder,
          levelName: l.levelName,
          editableFields: l.editableFields,
          approvers: l.approvers?.length || 0,
          approverGroups: l.approverGroups?.length || 0
        }))
      );

      // Get first level approvers
      const firstLevel = workflow.levels.find((l) => l.levelOrder === 1);
      if (!firstLevel) {
        throw new BadRequestException('Workflow has no levels configured');
      }

      // Resolve all approvers for first level (individual + group members)
      const firstLevelApproverIds = await this.resolveApproversForLevel(firstLevel, tx);

      // Update registration status
      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: RegistrationStatus.PENDING_APPROVAL,
          currentLevel: 1,
          workflowSnapshot: enrichedWorkflow as any,
        },
      });

      // Create approval records for first level
      await tx.registrationApproval.createMany({
        data: firstLevelApproverIds.map((approverId) => ({
          requestId: id,
          level: 1,
          approverId,
          approverEmail: '', // TODO: Get from user
          action: ApprovalAction.PENDING,
        })),
      });

      // Return updated registration with approvals
      const updated = await tx.registrationRequest.findUnique({
        where: { id },
        include: {
          approvals: true,
        },
      });

      this.logger.log(`Registration ${id} submitted. Created ${updated?.approvals.length || 0} approval records`);

      // TODO: Send email notifications to approvers

      return updated;
    }, {
      timeout: 30000,
      isolationLevel: 'Serializable',
    });
  }

  /**
   * Get editable fields for current level from workflow snapshot
   */
  private getEditableFieldsForLevel(workflowSnapshot: any, levelOrder: number): string[] {
    this.logger.debug(`Looking for level ${levelOrder} in workflow snapshot. Available levels:`,
      workflowSnapshot?.levels?.map((l: any) => ({
        levelOrder: l.levelOrder,
        levelName: l.levelName,
        editableFields: l.editableFields
      }))
    );
    const level = workflowSnapshot?.levels?.find((l: any) => l.levelOrder === levelOrder);
    this.logger.debug(`Found level:`, level);
    return level?.editableFields || [];
  }

  /**
   * Approve registration at current level
   * LOG-02: Uses transaction with pessimistic lock to prevent race conditions
   */
  async approve(id: string, dto: ApproveRegistrationDto, approverId: string) {
    this.logger.log(`Approving registration ${id} by user ${approverId}`);

    // LOG-02: Use transaction with FOR UPDATE lock to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      // Lock the registration row to prevent concurrent modifications
      // Cast column to text since Prisma uses text for UUID in schema without @db.Uuid
      const registrations = await tx.$queryRaw<any[]>(
        Prisma.sql`SELECT * FROM registration_requests WHERE id::text = ${id} FOR UPDATE`
      );
      const registration = registrations[0];

      if (!registration) {
        throw new NotFoundException(`Registration ${id} not found`);
      }

      // Note: Raw query returns snake_case column names from PostgreSQL
      const requestedById = registration.requested_by_id || registration.requestedById;
      const currentLevel = registration.current_level ?? registration.currentLevel;
      const currentStatus = registration.status as RegistrationStatus;
      const workflowSnapshot = registration.workflow_snapshot || registration.workflowSnapshot;
      const formData = registration.form_data || registration.formData;

      this.logger.debug(`Approval check - requestedById: ${requestedById}, approverId: ${approverId}, currentLevel: ${currentLevel}, status: ${currentStatus}`);

      // LOG-01: Prevent self-approval - user cannot approve their own request
      if (requestedById === approverId) {
        this.logger.warn(`Self-approval blocked: requestedById=${requestedById}, approverId=${approverId}`);
        throw new ForbiddenException('You cannot approve your own registration request');
      }

      // LOG-08: Validate status allows approval
      if (
        currentStatus !== RegistrationStatus.PENDING_APPROVAL &&
        currentStatus !== RegistrationStatus.IN_APPROVAL
      ) {
        throw new BadRequestException(`Registration is not pending approval (current status: ${currentStatus})`);
      }

      // Find pending approval for this user at current level
      this.logger.debug(`Looking for pending approval - requestId: ${id}, approverId: ${approverId}, level: ${currentLevel}`);
      const approval = await tx.registrationApproval.findFirst({
        where: {
          requestId: id,
          approverId,
          level: currentLevel,
          action: ApprovalAction.PENDING,
        },
      });

      this.logger.debug(`Found approval: ${approval ? approval.id : 'none'}`);

      if (!approval) {
        // List all approvals for debugging
        const allApprovals = await tx.registrationApproval.findMany({
          where: { requestId: id },
          select: { id: true, approverId: true, level: true, action: true },
        });
        this.logger.warn(`No pending approval found. All approvals for request: ${JSON.stringify(allApprovals)}`);
        throw new BadRequestException('No pending approval found for this user at current level');
      }

      // Process field changes if provided
      if (dto.fieldChanges && Object.keys(dto.fieldChanges).length > 0) {
        const editableFields = this.getEditableFieldsForLevel(
          workflowSnapshot,
          currentLevel,
        );

        const updatedFormData = await this.applyFieldChangesInTransaction(
          tx,
          id,
          formData as Record<string, any>,
          dto.fieldChanges,
          editableFields,
          approverId,
          currentLevel,
        );

        // Update registration with new form data
        await tx.registrationRequest.update({
          where: { id },
          data: { formData: updatedFormData },
        });
      }

      // Mark as approved
      await tx.registrationApproval.update({
        where: { id: approval.id },
        data: {
          action: ApprovalAction.APPROVED,
          comments: dto.comments,
          actionAt: new Date(),
        },
      });

      // Check if level is complete
      const pendingCount = await tx.registrationApproval.count({
        where: {
          requestId: id,
          level: currentLevel,
          action: ApprovalAction.PENDING,
        },
      });
      const levelComplete = pendingCount === 0;

      if (levelComplete) {
        // Pass normalized registration object for advanceToNextLevelInTransaction
        const normalizedRegistration = {
          ...registration,
          currentLevel,
          status: currentStatus,
        };
        await this.advanceToNextLevelInTransaction(tx, id, normalizedRegistration, workflowSnapshot);
      } else {
        // Update status to IN_APPROVAL if not already
        if (currentStatus !== RegistrationStatus.IN_APPROVAL) {
          await tx.registrationRequest.update({
            where: { id },
            data: { status: RegistrationStatus.IN_APPROVAL },
          });
        }
      }

      this.logger.log(`Registration ${id} approved by ${approverId}`);

      // Return the updated registration
      const updatedRegistration = await tx.registrationRequest.findUnique({
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
            select: { id: true, name: true, email: true },
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { level: 'asc' },
          },
        },
      });

      return updatedRegistration;
    }, {
      timeout: 30000, // 30 second timeout
      isolationLevel: 'Serializable', // Highest isolation level
    });

    // After transaction completes, trigger Protheus sync if workflow is complete
    const finalRegistration = await this.prisma.registrationRequest.findUnique({
      where: { id },
      select: { status: true },
    });

    if (finalRegistration?.status === RegistrationStatus.APPROVED) {
      // Trigger sync to Protheus (outside transaction)
      try {
        await this.protheusIntegrationService.syncToProtheus(id);
      } catch (error) {
        this.logger.error(`Failed to sync registration ${id} to Protheus`, error);
        // Error is already logged in ProtheusIntegrationService
      }
    }

    return this.findOne(id);
  }

  /**
   * Apply field changes within a transaction
   */
  private async applyFieldChangesInTransaction(
    tx: any,
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
      await tx.fieldChangeHistory.createMany({
        data: changeHistory,
      });

      this.logger.log(`Recorded ${changeHistory.length} field changes for registration ${registrationId}`);
    }

    return updatedFormData;
  }

  /**
   * Advance to next level within a transaction
   */
  private async advanceToNextLevelInTransaction(
    tx: any,
    id: string,
    registration: any,
    workflowSnapshot: any,
    iterationCount: number = 0,
  ) {
    // LOG-07: Prevent infinite loops
    const MAX_ITERATIONS = 100;
    if (iterationCount >= MAX_ITERATIONS) {
      this.logger.error(`Max iterations (${MAX_ITERATIONS}) reached for registration ${id}. Possible infinite loop.`);
      throw new BadRequestException('Workflow processing error: too many iterations. Please contact support.');
    }

    const nextLevel = workflowSnapshot.levels.find(
      (l: any) => l.levelOrder === registration.currentLevel + 1,
    );

    if (nextLevel) {
      // Has next level - resolve all approvers (individual + group members)
      this.logger.log(`Advancing registration ${id} to level ${nextLevel.levelOrder}`);

      const approverIds = await this.resolveApproversForLevel(nextLevel, tx);

      if (approverIds.length === 0) {
        this.logger.warn(`No approvers for level ${nextLevel.levelOrder}, skipping to next`);
        // Update current level and recursively advance
        const updatedRegistration = { ...registration, currentLevel: nextLevel.levelOrder };
        await tx.registrationRequest.update({
          where: { id },
          data: { currentLevel: nextLevel.levelOrder },
        });
        return this.advanceToNextLevelInTransaction(tx, id, updatedRegistration, workflowSnapshot, iterationCount + 1);
      }

      await tx.registrationRequest.update({
        where: { id },
        data: {
          currentLevel: nextLevel.levelOrder,
          status: RegistrationStatus.IN_APPROVAL,
        },
      });

      // Create approval records for next level
      await tx.registrationApproval.createMany({
        data: approverIds.map((approverId: string) => ({
          requestId: id,
          level: nextLevel.levelOrder,
          approverId,
          approverEmail: '', // TODO: Get from user
          action: ApprovalAction.PENDING,
        })),
      });

      // TODO: Send notifications to next level approvers
    } else {
      // No next level - workflow complete
      this.logger.log(`Registration ${id} approved - all levels complete`);

      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: RegistrationStatus.APPROVED,
        },
      });

      // Note: Protheus sync will be triggered outside transaction
    }
  }

  /**
   * Reject registration
   * LOG-02: Uses transaction with pessimistic lock to prevent race conditions
   */
  async reject(id: string, dto: RejectRegistrationDto, approverId: string) {
    this.logger.log(`Rejecting registration ${id} by user ${approverId}`);

    // LOG-02: Use transaction with FOR UPDATE lock to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      // Lock the registration row to prevent concurrent modifications
      // Cast column to text since Prisma uses text for UUID in schema without @db.Uuid
      const registrations = await tx.$queryRaw<any[]>(
        Prisma.sql`SELECT * FROM registration_requests WHERE id::text = ${id} FOR UPDATE`
      );
      const registration = registrations[0];

      if (!registration) {
        throw new NotFoundException(`Registration ${id} not found`);
      }

      // Note: Raw query returns snake_case column names from PostgreSQL
      const requestedById = registration.requested_by_id || registration.requestedById;
      const currentLevel = registration.current_level ?? registration.currentLevel;
      const currentStatus = registration.status as RegistrationStatus;

      // LOG-01: Prevent self-rejection - user cannot reject their own request
      if (requestedById === approverId) {
        throw new ForbiddenException('You cannot reject your own registration request');
      }

      // LOG-08: Validate status allows rejection
      if (
        currentStatus !== RegistrationStatus.PENDING_APPROVAL &&
        currentStatus !== RegistrationStatus.IN_APPROVAL
      ) {
        throw new BadRequestException(`Registration is not pending approval (current status: ${currentStatus})`);
      }

      // Validate transition to REJECTED
      validateStatusTransition(currentStatus, RegistrationStatus.REJECTED, 'reject');

      // Find pending approval for this user at current level
      const approval = await tx.registrationApproval.findFirst({
        where: {
          requestId: id,
          approverId,
          level: currentLevel,
          action: ApprovalAction.PENDING,
        },
      });

      if (!approval) {
        throw new BadRequestException('No pending approval found for this user at current level');
      }

      // Mark as rejected
      await tx.registrationApproval.update({
        where: { id: approval.id },
        data: {
          action: ApprovalAction.REJECTED,
          comments: dto.reason,
          actionAt: new Date(),
        },
      });

      // Update registration status to REJECTED
      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: RegistrationStatus.REJECTED,
        },
      });

      this.logger.log(`Registration ${id} rejected by ${approverId}`);

      // TODO: Send notification to requester

      // Return the updated registration
      return tx.registrationRequest.findUnique({
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
            select: { id: true, name: true, email: true },
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { level: 'asc' },
          },
        },
      });
    }, {
      timeout: 30000, // 30 second timeout
      isolationLevel: 'Serializable', // Highest isolation level
    });
  }

  /**
   * Send back registration to previous level or to requester (draft)
   * LOG-02: Uses transaction with pessimistic lock to prevent race conditions
   */
  async sendBack(id: string, dto: SendBackRegistrationDto, approverId: string) {
    this.logger.log(`Sending back registration ${id} by user ${approverId}`);

    return this.prisma.$transaction(async (tx) => {
      // Lock the registration row to prevent concurrent modifications
      const registrations = await tx.$queryRaw<any[]>(
        Prisma.sql`SELECT * FROM registration_requests WHERE id::text = ${id} FOR UPDATE`
      );
      const registration = registrations[0];

      if (!registration) {
        throw new NotFoundException(`Registration ${id} not found`);
      }

      // Note: Raw query returns snake_case column names from PostgreSQL
      const currentLevel = registration.current_level ?? registration.currentLevel;
      const currentStatus = registration.status as RegistrationStatus;
      const workflowSnapshot = registration.workflow_snapshot || registration.workflowSnapshot;

      // Note: Self-sendback is allowed - an approver can send back their own request
      // This is different from approve/reject where self-action is blocked

      // Validate status allows send back
      if (
        currentStatus !== RegistrationStatus.PENDING_APPROVAL &&
        currentStatus !== RegistrationStatus.IN_APPROVAL
      ) {
        throw new BadRequestException(`Registration is not pending approval (current status: ${currentStatus})`);
      }

      // Find pending approval for this user at current level
      const approval = await tx.registrationApproval.findFirst({
        where: {
          requestId: id,
          approverId,
          level: currentLevel,
          action: ApprovalAction.PENDING,
        },
      });

      if (!approval) {
        throw new BadRequestException('No pending approval found for this user at current level');
      }

      // Determine target level
      // If targetLevel is 0, return to DRAFT (requester)
      // If targetLevel is not provided, go to previous level (currentLevel - 1)
      // If targetLevel is provided and > 0, go to that specific level
      let targetLevel = dto.targetLevel !== undefined ? dto.targetLevel : currentLevel - 1;

      // Validate target level
      if (targetLevel < 0) {
        targetLevel = 0;
      }
      if (targetLevel >= currentLevel) {
        throw new BadRequestException(`Target level (${targetLevel}) must be less than current level (${currentLevel})`);
      }

      this.logger.debug(`Send back: current level ${currentLevel} -> target level ${targetLevel}`);

      // Mark current approval as SENT_BACK
      await tx.registrationApproval.update({
        where: { id: approval.id },
        data: {
          action: ApprovalAction.SENT_BACK,
          comments: dto.reason,
          actionAt: new Date(),
        },
      });

      // Cancel all other pending approvals at current level
      await tx.registrationApproval.updateMany({
        where: {
          requestId: id,
          level: currentLevel,
          action: ApprovalAction.PENDING,
        },
        data: {
          action: ApprovalAction.SENT_BACK,
          comments: `Cancelled due to send back by another approver`,
          actionAt: new Date(),
        },
      });

      if (targetLevel === 0) {
        // Return to DRAFT status - requester needs to resubmit
        await tx.registrationRequest.update({
          where: { id },
          data: {
            status: RegistrationStatus.DRAFT,
            currentLevel: 0,
          },
        });

        this.logger.log(`Registration ${id} sent back to DRAFT by ${approverId}`);
      } else {
        // Return to a previous approval level
        // Update status to RETURNED and set target level
        await tx.registrationRequest.update({
          where: { id },
          data: {
            status: RegistrationStatus.RETURNED,
            currentLevel: targetLevel,
          },
        });

        // Create new pending approvals for the target level
        const snapshot = workflowSnapshot as any;
        const targetLevelConfig = snapshot?.levels?.find((l: any) => l.levelOrder === targetLevel);

        if (targetLevelConfig) {
          // Resolve approvers for the target level
          const approverIds = await this.resolveApproversForLevel(targetLevelConfig, tx);

          // Create approval records for target level
          for (const approverIdItem of approverIds) {
            await tx.registrationApproval.create({
              data: {
                requestId: id,
                level: targetLevel,
                approverId: approverIdItem,
                approverEmail: '', // TODO: Get from user
                action: ApprovalAction.PENDING,
              },
            });
          }

          // Update status to appropriate state
          await tx.registrationRequest.update({
            where: { id },
            data: {
              status: RegistrationStatus.PENDING_APPROVAL,
            },
          });
        }

        this.logger.log(`Registration ${id} sent back to level ${targetLevel} by ${approverId}`);
      }

      // TODO: Send notification to requester or previous level approvers

      // Return the updated registration
      return tx.registrationRequest.findUnique({
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
            select: { id: true, name: true, email: true },
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { level: 'asc' },
          },
        },
      });
    }, {
      timeout: 30000,
      isolationLevel: 'Serializable',
    });
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrich workflow snapshots with approver names
    const enrichedRequests = await Promise.all(
      approvals.map(async (a) => {
        const request = a.request;
        if (request.workflowSnapshot) {
          const snapshot = request.workflowSnapshot as any;
          const needsEnrichment = snapshot.levels?.some((level: any) => {
            const hasApproverIds = level.approverIds && level.approverIds.length > 0;
            const hasGroupIds = level.approverGroupIds && level.approverGroupIds.length > 0;
            const hasEnrichedApprovers = level.approvers && level.approvers.length > 0;
            const hasEnrichedGroups = level.approverGroups && level.approverGroups.length > 0;
            return (hasApproverIds && !hasEnrichedApprovers) || (hasGroupIds && !hasEnrichedGroups);
          });

          if (needsEnrichment) {
            const enrichedSnapshot = await this.enrichWorkflowWithNames(snapshot);
            return {
              ...request,
              workflowSnapshot: enrichedSnapshot,
            };
          }
        }
        return request;
      })
    );

    return enrichedRequests;
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

    // Debug log to identify issue with editable fields
    this.logger.debug(`getEditableFieldsInfo for registration ${registrationId}:`, {
      currentLevel: registration.currentLevel,
      workflowSnapshot: JSON.stringify(registration.workflowSnapshot),
      editableFields,
    });

    return {
      editableFields,
      currentLevel: registration.currentLevel,
    };
  }

  // ==========================================
  // LOG-03: STUCK WORKFLOW DETECTION AND ADMIN OVERRIDE
  // ==========================================

  /**
   * Check if a registration's workflow is stuck (approvers deleted/deactivated)
   * Returns information about the stuck status
   */
  async checkWorkflowStuckStatus(registrationId: string) {
    const registration = await this.findOne(registrationId);

    // Only check in-progress registrations
    if (
      registration.status !== RegistrationStatus.PENDING_APPROVAL &&
      registration.status !== RegistrationStatus.IN_APPROVAL
    ) {
      return {
        isStuck: false,
        reason: null,
        currentLevel: registration.currentLevel,
        status: registration.status,
      };
    }

    // Get all pending approvals at current level
    const pendingApprovals = registration.approvals.filter(
      (a) => a.level === registration.currentLevel && a.action === ApprovalAction.PENDING
    );

    if (pendingApprovals.length === 0) {
      // No pending approvals but status indicates waiting - workflow is stuck
      return {
        isStuck: true,
        reason: 'No pending approvals at current level',
        currentLevel: registration.currentLevel,
        status: registration.status,
        pendingApprovers: [],
      };
    }

    // Check if any pending approvers are deactivated
    const approverIds = pendingApprovals.map((a) => a.approverId);
    const activeApprovers = await this.prisma.user.findMany({
      where: {
        id: { in: approverIds },
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });

    const activeApproverIds = new Set(activeApprovers.map((u) => u.id));
    const deactivatedApprovers = pendingApprovals
      .filter((a) => !activeApproverIds.has(a.approverId))
      .map((a) => ({
        approvalId: a.id,
        approverId: a.approverId,
        approverName: a.approver?.name || 'Unknown',
        approverEmail: a.approver?.email || 'Unknown',
      }));

    if (deactivatedApprovers.length > 0 && deactivatedApprovers.length === pendingApprovals.length) {
      // All pending approvers are deactivated - workflow is stuck
      return {
        isStuck: true,
        reason: 'All pending approvers are deactivated',
        currentLevel: registration.currentLevel,
        status: registration.status,
        deactivatedApprovers,
        activeApprovers: activeApprovers,
      };
    }

    return {
      isStuck: false,
      reason: null,
      currentLevel: registration.currentLevel,
      status: registration.status,
      pendingApprovers: pendingApprovals.map((a) => ({
        approverId: a.approverId,
        approverName: a.approver?.name || 'Unknown',
        isActive: activeApproverIds.has(a.approverId),
      })),
    };
  }

  /**
   * Get all stuck workflows in the system
   * Returns list of registrations with stuck workflows
   */
  async getStuckWorkflows() {
    // Get all registrations in approval status
    const inProgressRegistrations = await this.prisma.registrationRequest.findMany({
      where: {
        status: {
          in: [RegistrationStatus.PENDING_APPROVAL, RegistrationStatus.IN_APPROVAL],
        },
      },
      include: {
        template: true,
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, email: true, isActive: true },
            },
          },
        },
      },
    });

    const stuckRegistrations = [];

    for (const reg of inProgressRegistrations) {
      const pendingApprovals = reg.approvals.filter(
        (a) => a.level === reg.currentLevel && a.action === ApprovalAction.PENDING
      );

      // Check if all pending approvers are inactive
      const allInactive = pendingApprovals.length > 0 &&
        pendingApprovals.every((a) => !a.approver?.isActive);

      if (allInactive || pendingApprovals.length === 0) {
        stuckRegistrations.push({
          registrationId: reg.id,
          templateName: reg.template.label,
          tableName: reg.tableName,
          requestedBy: reg.requestedBy,
          status: reg.status,
          currentLevel: reg.currentLevel,
          createdAt: reg.createdAt,
          pendingApprovals: pendingApprovals.map((a) => ({
            approverId: a.approverId,
            approverName: a.approver?.name || 'Unknown',
            approverEmail: a.approver?.email || 'Unknown',
            isActive: a.approver?.isActive ?? false,
          })),
          reason: pendingApprovals.length === 0
            ? 'No pending approvals at current level'
            : 'All pending approvers are deactivated',
        });
      }
    }

    return stuckRegistrations;
  }

  /**
   * Admin override to advance a stuck workflow
   * This allows an admin to force-approve or skip the current level
   */
  async adminOverrideAdvance(
    registrationId: string,
    adminId: string,
    action: 'force_approve' | 'skip_level',
    comments?: string,
  ) {
    this.logger.log(`Admin ${adminId} performing override (${action}) on registration ${registrationId}`);

    // Verify admin has permission (checked in controller via guard)
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, isAdmin: true },
    });

    if (!admin?.isAdmin) {
      throw new ForbiddenException('Only administrators can perform workflow overrides');
    }

    return this.prisma.$transaction(async (tx) => {
      // Lock the registration
      // Cast column to text since Prisma uses text for UUID in schema without @db.Uuid
      const registrations = await tx.$queryRaw<any[]>(
        Prisma.sql`SELECT * FROM registration_requests WHERE id::text = ${registrationId} FOR UPDATE`
      );
      const registration = registrations[0];

      if (!registration) {
        throw new NotFoundException(`Registration ${registrationId} not found`);
      }

      // Note: Raw query returns snake_case column names from PostgreSQL
      const currentLevel = registration.current_level ?? registration.currentLevel;
      const currentStatus = registration.status as RegistrationStatus;
      const workflowSnapshot = registration.workflow_snapshot || registration.workflowSnapshot;

      if (
        currentStatus !== RegistrationStatus.PENDING_APPROVAL &&
        currentStatus !== RegistrationStatus.IN_APPROVAL
      ) {
        throw new BadRequestException(
          `Cannot override registration with status ${currentStatus}. Only PENDING_APPROVAL or IN_APPROVAL can be overridden.`
        );
      }

      // Mark all pending approvals at current level as admin-overridden
      await tx.registrationApproval.updateMany({
        where: {
          requestId: registrationId,
          level: currentLevel,
          action: ApprovalAction.PENDING,
        },
        data: {
          action: ApprovalAction.APPROVED,
          comments: `[ADMIN OVERRIDE by ${admin.name}] ${action === 'force_approve' ? 'Force approved' : 'Level skipped'}${comments ? ': ' + comments : ''}`,
          actionAt: new Date(),
        },
      });

      // Create audit record for this override
      await tx.fieldChangeHistory.create({
        data: {
          requestId: registrationId,
          fieldName: '__ADMIN_OVERRIDE__',
          previousValue: JSON.stringify({
            action,
            level: currentLevel,
            status: currentStatus,
          }),
          newValue: JSON.stringify({
            overriddenBy: admin.name,
            overriddenAt: new Date().toISOString(),
            comments,
          }),
          changedById: adminId,
          approvalLevel: currentLevel,
        },
      });

      // Pass normalized registration object for advanceToNextLevelInTransaction
      const normalizedRegistration = {
        ...registration,
        currentLevel,
        status: currentStatus,
      };

      // Advance to next level (reusing existing logic)
      await this.advanceToNextLevelInTransaction(
        tx,
        registrationId,
        normalizedRegistration,
        workflowSnapshot,
        0, // iteration count
      );

      this.logger.log(`Admin override completed for registration ${registrationId}`);

      // Return updated registration
      return tx.registrationRequest.findUnique({
        where: { id: registrationId },
        include: {
          template: true,
          requestedBy: { select: { id: true, name: true, email: true } },
          approvals: {
            include: {
              approver: { select: { id: true, name: true, email: true } },
            },
            orderBy: { level: 'asc' },
          },
        },
      });
    }, {
      timeout: 30000,
      isolationLevel: 'Serializable',
    });
  }
}
