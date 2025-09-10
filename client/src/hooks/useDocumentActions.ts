import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApproveDocument, useRejectDocument, QUERY_KEYS } from './useDocuments';
import { useAuthStore } from '../stores/authStore';
import type { ProtheusDocument, DocumentApprovalLevel } from '../types/auth';

export interface DocumentActionState {
  confirmDialog: {
    open: boolean;
    action: 'approve' | 'reject';
    document: ProtheusDocument | null;
  };
  bulkConfirmDialog: {
    open: boolean;
    action: 'approve' | 'reject';
    documentCount: number;
  };
  selectedDocuments: Set<string>;
  showBulkActions: boolean;
}

export const useDocumentActions = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();

  const [confirmDialog, setConfirmDialog] = useState<DocumentActionState['confirmDialog']>({
    open: false,
    action: 'approve',
    document: null
  });

  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<DocumentActionState['bulkConfirmDialog']>({
    open: false,
    action: 'approve',
    documentCount: 0
  });

  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleApprove = (document: ProtheusDocument) => {
    setConfirmDialog({
      open: true,
      action: 'approve',
      document
    });
  };

  const handleReject = (document: ProtheusDocument) => {
    setConfirmDialog({
      open: true,
      action: 'reject',
      document
    });
  };

  const handleConfirmAction = (comments?: string) => {
    if (!confirmDialog.document || !user) return;

    const document = confirmDialog.document;
    const action = confirmDialog.action;
    const mutationOptions = {
      documentId: document.numero.trim(),
      action,
      approverId: user.email || user.id,
      comments: comments || (action === 'reject' ? 'Rejeitado pelo aprovador' : ''),
      document,
    };

    const mutation = action === 'approve' ? approveDocument : rejectDocument;
    
    mutation.mutate(mutationOptions, {
      onSuccess: () => {
        console.log(`Documento ${document.numero.trim()} ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`);
      },
      onError: () => {
        console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} documento ${document.numero.trim()}`);
      }
    });

    setConfirmDialog({ open: false, action: 'approve', document: null });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, action: 'approve', document: null });
  };

  const handleSelectDocument = (documentNumber: string, selected: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (selected) {
      newSelected.add(documentNumber);
    } else {
      newSelected.delete(documentNumber);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = (pendingDocs: ProtheusDocument[]) => {
    if (selectedDocuments.size === pendingDocs.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(pendingDocs.map(doc => doc.numero.trim())));
    }
  };

  const toggleBulkActions = () => {
    setShowBulkActions(!showBulkActions);
    setSelectedDocuments(new Set());
  };

  const handleBulkApprove = () => {
    setBulkConfirmDialog({
      open: true,
      action: 'approve',
      documentCount: selectedDocuments.size
    });
  };

  const handleBulkReject = () => {
    setBulkConfirmDialog({
      open: true,
      action: 'reject',
      documentCount: selectedDocuments.size
    });
  };

  const handleCloseBulkDialog = () => {
    setBulkConfirmDialog({ open: false, action: 'approve', documentCount: 0 });
  };

  const executeBulkAction = (
    documents: ProtheusDocument[],
    action: 'approve' | 'reject',
    comments?: string
  ) => {
    const documentsToProcess = Array.from(selectedDocuments);
    let currentIndex = 0;
    
    const processNextDocument = () => {
      if (currentIndex >= documentsToProcess.length) {
        console.log(`${action === 'approve' ? 'Aprovação' : 'Rejeição'} em massa concluída`);
        setSelectedDocuments(new Set());
        setShowBulkActions(false);
        return;
      }
      
      const documentNumber = documentsToProcess[currentIndex];
      const document = documents.find(doc => doc.numero.trim() === documentNumber);
      
      if (!document || !user) {
        currentIndex++;
        processNextDocument();
        return;
      }

      const mutation = action === 'approve' ? approveDocument : rejectDocument;
      const defaultComment = action === 'approve' ? 'Aprovado em massa' : 'Rejeitado em massa';
      
      mutation.mutate({
        documentId: documentNumber,
        action,
        approverId: user.email || user.id,
        comments: comments || defaultComment,
        document,
      }, {
        onSuccess: () => {
          console.log(`✓ Documento ${documentNumber} ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`);
          currentIndex++;
          setTimeout(processNextDocument, 500);
        },
        onError: (error) => {
          console.error(`✗ Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} documento ${documentNumber}:`, error.message);
          currentIndex++;
          setTimeout(processNextDocument, 500);
        }
      });
    };
    
    processNextDocument();
  };

  const handleBulkConfirmAction = (documents: ProtheusDocument[], comments?: string) => {
    executeBulkAction(documents, bulkConfirmDialog.action, comments);
    setBulkConfirmDialog({ open: false, action: 'approve', documentCount: 0 });
  };

  return {
    // States
    confirmDialog,
    bulkConfirmDialog,
    selectedDocuments,
    showBulkActions,
    
    // Individual actions
    handleApprove,
    handleReject,
    handleConfirmAction,
    handleCloseDialog,
    
    // Bulk actions
    handleSelectDocument,
    handleSelectAll,
    toggleBulkActions,
    handleBulkApprove,
    handleBulkReject,
    handleCloseBulkDialog,
    handleBulkConfirmAction,
    
    // Loading states
    isProcessing: approveDocument.isPending || rejectDocument.isPending,
  };
};

// Helper function to get current approval status
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

// Helper function to format document value
export const formatDocumentValue = (document: ProtheusDocument | null): string | undefined => {
  if (!document) return undefined;
  
  const numValue = parseFloat(document.vl_tot_documento.replace(/\./g, '').replace(',', '.'));
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};