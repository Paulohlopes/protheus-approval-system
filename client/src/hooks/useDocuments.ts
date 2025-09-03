import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { documentService } from '../services/documentService';
import { useDocumentStore } from '../stores/documentStore';
import type { 
  ProtheusDocument, 
  DocumentFilters, 
  PaginationParams, 
  ApprovalAction 
} from '../types/auth';

// Query keys
export const QUERY_KEYS = {
  documents: ['documents'],
  document: (id: string) => ['documents', id],
  stats: ['dashboard', 'stats'],
} as const;

// Hook for fetching documents
export const useDocuments = (filters?: DocumentFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.documents, filters, pagination],
    queryFn: () => documentService.getDocuments(filters, pagination),
    enabled: true,
  });
};

// Hook for fetching single document
export const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.document(documentId),
    queryFn: () => documentService.getDocument(documentId),
    enabled: !!documentId,
  });
};

// Hook for dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: () => documentService.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes - stats can be cached longer
  });
};

// Hook for approving document
export const useApproveDocument = () => {
  const queryClient = useQueryClient();
  const { updateDocumentStatus } = useDocumentStore();

  return useMutation({
    mutationFn: (action: ApprovalAction) => documentService.approveDocument(action),
    onMutate: async (action) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.documents });

      // Optimistically update the document status
      updateDocumentStatus(action.documentId, 'approved');

      // Show optimistic success message
      toast.success('Documento aprovado com sucesso!');
    },
    onError: (error, action) => {
      // Revert optimistic update
      updateDocumentStatus(action.documentId, 'pending');
      toast.error(error.message || 'Erro ao aprovar documento');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
};

// Hook for rejecting document
export const useRejectDocument = () => {
  const queryClient = useQueryClient();
  const { updateDocumentStatus } = useDocumentStore();

  return useMutation({
    mutationFn: (action: ApprovalAction) => documentService.rejectDocument(action),
    onMutate: async (action) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.documents });

      // Optimistically update the document status
      updateDocumentStatus(action.documentId, 'rejected');

      // Show optimistic success message
      toast.success('Documento rejeitado com sucesso!');
    },
    onError: (error, action) => {
      // Revert optimistic update
      updateDocumentStatus(action.documentId, 'pending');
      toast.error(error.message || 'Erro ao rejeitar documento');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
  });
};