import { create } from 'zustand';
import type { 
  ProtheusDocument, 
  DocumentFilters, 
  PaginationParams, 
  DashboardStats,
  ApprovalAction 
} from '../types/auth';

interface DocumentStore {
  // State
  documents: ProtheusDocument[];
  selectedDocument: ProtheusDocument | null;
  filters: DocumentFilters;
  pagination: PaginationParams;
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: ProtheusDocument[]) => void;
  setSelectedDocument: (document: ProtheusDocument | null) => void;
  setFilters: (filters: DocumentFilters) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  setStats: (stats: DashboardStats) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Document operations
  approveDocument: (action: ApprovalAction) => Promise<void>;
  rejectDocument: (action: ApprovalAction) => Promise<void>;
  updateDocumentStatus: (documentId: string, status: ProtheusDocument['status']) => void;
  
  // Filters and search
  resetFilters: () => void;
  applyFilters: (newFilters: Partial<DocumentFilters>) => void;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

const initialFilters: DocumentFilters = {
  status: ['pending'],
  priority: [],
  type: [],
  search: '',
};

const initialPagination: PaginationParams = {
  page: 1,
  limit: 10,
  sortBy: 'requestDate',
  sortOrder: 'desc',
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: [],
  selectedDocument: null,
  filters: initialFilters,
  pagination: initialPagination,
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  setDocuments: (documents: ProtheusDocument[]) => {
    set({ documents, error: null });
  },

  setSelectedDocument: (document: ProtheusDocument | null) => {
    set({ selectedDocument: document });
  },

  setFilters: (filters: DocumentFilters) => {
    set({ 
      filters,
      pagination: { ...get().pagination, page: 1 } // Reset to first page when filters change
    });
  },

  setPagination: (pagination: Partial<PaginationParams>) => {
    set({ 
      pagination: { ...get().pagination, ...pagination } 
    });
  },

  setStats: (stats: DashboardStats) => {
    set({ stats });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Document operations
  approveDocument: async (action: ApprovalAction) => {
    const { documents } = get();
    
    // Optimistically update the document status
    const updatedDocuments = documents.map(doc => 
      doc.id === action.documentId 
        ? { ...doc, status: 'approved' as const }
        : doc
    );
    
    set({ documents: updatedDocuments });
    
    try {
      // TODO: Implement API call to approve document
      console.log('Approving document:', action);
      
      // Update stats after successful approval
      const stats = get().stats;
      if (stats) {
        set({
          stats: {
            ...stats,
            totalPending: stats.totalPending - 1,
            totalApproved: stats.totalApproved + 1,
          }
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      set({ documents, error: error.message });
      throw error;
    }
  },

  rejectDocument: async (action: ApprovalAction) => {
    const { documents } = get();
    
    // Optimistically update the document status
    const updatedDocuments = documents.map(doc => 
      doc.id === action.documentId 
        ? { ...doc, status: 'rejected' as const }
        : doc
    );
    
    set({ documents: updatedDocuments });
    
    try {
      // TODO: Implement API call to reject document
      console.log('Rejecting document:', action);
      
      // Update stats after successful rejection
      const stats = get().stats;
      if (stats) {
        set({
          stats: {
            ...stats,
            totalPending: stats.totalPending - 1,
            totalRejected: stats.totalRejected + 1,
          }
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      set({ documents, error: error.message });
      throw error;
    }
  },

  updateDocumentStatus: (documentId: string, status: ProtheusDocument['status']) => {
    const { documents } = get();
    const updatedDocuments = documents.map(doc => 
      doc.id === documentId 
        ? { ...doc, status }
        : doc
    );
    set({ documents: updatedDocuments });
  },

  // Filters and search
  resetFilters: () => {
    set({ 
      filters: initialFilters,
      pagination: { ...get().pagination, page: 1 }
    });
  },

  applyFilters: (newFilters: Partial<DocumentFilters>) => {
    const { filters } = get();
    set({ 
      filters: { ...filters, ...newFilters },
      pagination: { ...get().pagination, page: 1 }
    });
  },

  // Pagination
  nextPage: () => {
    const { pagination } = get();
    set({ 
      pagination: { ...pagination, page: pagination.page + 1 }
    });
  },

  prevPage: () => {
    const { pagination } = get();
    if (pagination.page > 1) {
      set({ 
        pagination: { ...pagination, page: pagination.page - 1 }
      });
    }
  },

  setPage: (page: number) => {
    const { pagination } = get();
    set({ 
      pagination: { ...pagination, page: Math.max(1, page) }
    });
  },
}));