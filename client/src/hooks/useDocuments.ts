import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { documentService } from '../services/documentService';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import type { 
  ProtheusDocument, 
  DocumentFilters, 
  PaginationParams, 
  ApprovalAction,
  ProtheusApiResponse 
} from '../types/auth';

// Query keys
export const QUERY_KEYS = {
  documents: ['documents'],
  document: (id: string) => ['documents', id],
  stats: ['dashboard', 'stats'],
} as const;

// Hook for fetching documents
export const useDocuments = (filters?: DocumentFilters, pagination?: PaginationParams) => {
  const { user } = useAuthStore();
  
  // Serializar filtros para evitar problemas de referência
  const filtersKey = JSON.stringify(filters || {});
  const paginationKey = JSON.stringify(pagination || {});
  
  return useQuery<ProtheusApiResponse>({
    queryKey: [...QUERY_KEYS.documents, filtersKey, paginationKey, user?.email],
    queryFn: () => {
      if (!user?.email) {
        throw new Error('Usuário não autenticado');
      }
      console.log('useDocuments.queryFn - Executing with filters:', filters);
      return documentService.getDocuments(user.email, filters, pagination);
    },
    enabled: !!user?.email,
    staleTime: 0, // Força sempre buscar dados frescos
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching single document
export const useDocument = (documentNumber: string) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.document(documentNumber),
    queryFn: () => {
      if (!user?.email) {
        throw new Error('Usuário não autenticado');
      }
      return documentService.getDocument(documentNumber, user.email);
    },
    enabled: !!documentNumber && !!user?.email,
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