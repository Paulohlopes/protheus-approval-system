import type { ProtheusDocument, DocumentApprovalLevel } from '../types/auth';

export const getTypeColor = (type: ProtheusDocument['tipo']) => {
  switch (type) {
    case 'IP':
      return 'primary';
    case 'SC':
      return 'info';
    case 'CP':
      return 'warning';
    default:
      return 'default';
  }
};

export const getTypeLabel = (type: ProtheusDocument['tipo']) => {
  switch (type) {
    case 'IP':
      return 'Pedido de Compra';
    case 'SC':
      return 'Solicitação de Compra';
    case 'CP':
      return 'Contrato de Parceria';
    default:
      return type;
  }
};

export const getStatusColor = (situacao: string) => {
  switch (situacao) {
    case 'Liberado':
      return 'success';
    case 'Pendente':
      return 'warning';
    case 'Aguardando nivel anterior':
      return 'info';
    case 'Rejeitado':
      return 'error';
    default:
      return 'default';
  }
};

export const getCurrentApprovalStatus = (
  alcada: DocumentApprovalLevel[],
  userEmail?: string
): DocumentApprovalLevel => {
  const currentLevel = alcada.find(level =>
    level.CIDENTIFICADOR === userEmail?.split('@')[0] ||
    level.CNOME === userEmail?.split('@')[0]
  );
  return currentLevel || alcada[0];
};

/**
 * Gets the overall document status based on all approval levels
 * A document is only "Liberado" if ALL levels are approved
 */
export const getDocumentStatus = (alcada: DocumentApprovalLevel[]): string => {
  if (!alcada || alcada.length === 0) return 'Pendente';

  // Check if any level is rejected
  const hasRejected = alcada.some(level => level.situacao_aprov === 'Rejeitado');
  if (hasRejected) return 'Rejeitado';

  // Check if any level is pending
  const hasPending = alcada.some(level => level.situacao_aprov === 'Pendente');
  if (hasPending) return 'Pendente';

  // All levels must be "Liberado"
  const allApproved = alcada.every(level => level.situacao_aprov === 'Liberado');
  if (allApproved) return 'Liberado';

  // Default to pending if status is unclear
  return 'Pendente';
};

/**
 * Checks if the current user can approve/reject the document
 * Returns true only if:
 * 1. The user is in the approval hierarchy
 * 2. All previous levels are approved
 * 3. The user's level is pending
 */
export const canUserApprove = (
  alcada: DocumentApprovalLevel[],
  userEmail?: string
): boolean => {
  if (!alcada || alcada.length === 0 || !userEmail) return false;

  // Find user's position in the hierarchy
  const userIndex = alcada.findIndex(level =>
    level.CIDENTIFICADOR === userEmail.split('@')[0] ||
    level.CNOME === userEmail.split('@')[0] ||
    level.aprovador_aprov === userEmail.split('@')[0]
  );

  // User not in hierarchy
  if (userIndex === -1) return false;

  const userLevel = alcada[userIndex];

  // User's level must be pending
  if (userLevel.situacao_aprov !== 'Pendente') return false;

  // Check if all previous levels are approved
  for (let i = 0; i < userIndex; i++) {
    if (alcada[i].situacao_aprov !== 'Liberado') {
      return false; // Previous level not approved yet
    }
  }

  // User can approve
  return true;
};