import { useState, useEffect } from 'react';
import { registrationService } from '../../services/registrationService';
import { RegistrationRequest, RegistrationStatus } from '../../types/registration';

export const ApprovalQueuePage = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      // TODO: Get user ID from auth context
      const userId = 'current-user-id';
      const data = await registrationService.getPendingApprovals(userId);
      setRequests(data);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      alert('Erro ao carregar aprovações pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, comments?: string) => {
    try {
      setActionLoading(true);
      await registrationService.approveRegistration(requestId, comments);
      alert('Solicitação aprovada com sucesso!');
      setSelectedRequest(null);
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Erro ao aprovar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      setActionLoading(true);
      await registrationService.rejectRegistration(requestId, reason);
      alert('Solicitação rejeitada');
      setSelectedRequest(null);
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Erro ao rejeitar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    const colors: Record<RegistrationStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      IN_APPROVAL: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SYNCING_TO_PROTHEUS: 'bg-purple-100 text-purple-800',
      SYNCED: 'bg-green-100 text-green-800',
      SYNC_FAILED: 'bg-red-100 text-red-800',
    };

    const labels: Record<RegistrationStatus, string> = {
      DRAFT: 'Rascunho',
      PENDING_APPROVAL: 'Aguardando Aprovação',
      IN_APPROVAL: 'Em Aprovação',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      SYNCING_TO_PROTHEUS: 'Sincronizando',
      SYNCED: 'Sincronizado',
      SYNC_FAILED: 'Falha na Sincronização',
    };

    return (
      <span className={`inline-block px-2 py-1 text-xs rounded ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Fila de Aprovação</h1>

      <div className="bg-white rounded-lg shadow">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhuma solicitação pendente de aprovação
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.template?.label || request.tableName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.requestedBy?.name || request.requestedByEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">Nível {request.currentLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Revisar Solicitação</h2>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Informações</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm">
                  <span className="font-medium">Tipo:</span>{' '}
                  {selectedRequest.template?.label || selectedRequest.tableName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Solicitante:</span>{' '}
                  {selectedRequest.requestedBy?.name || selectedRequest.requestedByEmail}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Data:</span>{' '}
                  {new Date(selectedRequest.requestedAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Nível Atual:</span> {selectedRequest.currentLevel}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Dados do Formulário</h3>
              <div className="bg-gray-50 p-4 rounded space-y-2">
                {Object.entries(selectedRequest.formData).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                disabled={actionLoading}
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Motivo da rejeição:');
                  if (reason) {
                    handleReject(selectedRequest.id, reason);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                disabled={actionLoading}
              >
                Rejeitar
              </button>
              <button
                onClick={() => {
                  const comments = prompt('Comentários (opcional):');
                  handleApprove(selectedRequest.id, comments || undefined);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                disabled={actionLoading}
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
