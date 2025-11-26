import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { RegistrationRequest, RegistrationStatus } from '../../types/registration';
import { ConfirmDialog } from '../../components/InputDialog';

export const MyRequestsPage = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [retrySyncDialogOpen, setRetrySyncDialogOpen] = useState(false);
  const [requestIdToRetry, setRequestIdToRetry] = useState<string | null>(null);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        toast.error('Usuário não autenticado');
        setRequests([]);
        return;
      }

      // Use backend filter for better performance and security
      const data = await registrationService.getRegistrations({
        requestedById: user.id,
      });
      setRequests(data);
    } catch (error: any) {
      console.error('Error loading requests:', error);

      // Better error handling
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 403) {
        toast.error('Você não tem permissão para acessar este recurso.');
      } else {
        toast.error('Erro ao carregar solicitações. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySyncClick = (requestId: string) => {
    setRequestIdToRetry(requestId);
    setRetrySyncDialogOpen(true);
  };

  const handleRetrySync = async () => {
    if (!requestIdToRetry) return;

    setRetrySyncDialogOpen(false);

    try {
      await registrationService.retrySync(requestIdToRetry);
      toast.success('Sincronização iniciada com sucesso!');
      await loadMyRequests();
    } catch (error) {
      console.error('Error retrying sync:', error);
      toast.error('Erro ao retentar sincronização. Por favor, tente novamente.');
    } finally {
      setRequestIdToRetry(null);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minhas Solicitações</h1>
        <Link
          to="/registration/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nova Solicitação
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Você ainda não tem solicitações. Crie uma nova solicitação para começar.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Protheus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">
                        {request.template?.label || request.tableName}
                      </div>
                      <div className="text-sm text-gray-500">Nível {request.currentLevel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {request.protheusRecno ? (
                      <span className="text-green-600">RECNO: {request.protheusRecno}</span>
                    ) : request.status === RegistrationStatus.SYNC_FAILED ? (
                      <button
                        onClick={() => handleRetrySyncClick(request.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Retentar
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detalhes da Solicitação</h2>

            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Tipo:</span>{' '}
                  {selectedRequest.template?.label || selectedRequest.tableName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Data:</span>{' '}
                  {new Date(selectedRequest.requestedAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedRequest.status)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Nível Atual:</span> {selectedRequest.currentLevel}
                </p>
                {selectedRequest.protheusRecno && (
                  <p className="text-sm">
                    <span className="font-medium">RECNO Protheus:</span> {selectedRequest.protheusRecno}
                  </p>
                )}
                {selectedRequest.syncError && (
                  <p className="text-sm text-red-600">
                    <span className="font-medium">Erro:</span> {selectedRequest.syncError}
                  </p>
                )}
              </div>
            </div>

            {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Histórico de Aprovações</h3>
                <div className="space-y-2">
                  {selectedRequest.approvals.map((approval) => (
                    <div key={approval.id} className="bg-gray-50 p-3 rounded text-sm">
                      <p>
                        <span className="font-medium">Nível {approval.level}:</span>{' '}
                        {approval.approver?.name || approval.approverEmail}
                      </p>
                      <p>
                        <span className="font-medium">Ação:</span> {approval.action}
                      </p>
                      {approval.comments && (
                        <p>
                          <span className="font-medium">Comentários:</span> {approval.comments}
                        </p>
                      )}
                      {approval.actionAt && (
                        <p className="text-gray-500">
                          {new Date(approval.actionAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Dados do Formulário</h3>
              <div className="bg-gray-50 p-4 rounded space-y-2">
                {Object.entries(selectedRequest.formData).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retry Sync Confirmation Dialog */}
      <ConfirmDialog
        open={retrySyncDialogOpen}
        title="Retentar Sincronização"
        message="Deseja retentar a sincronização com o Protheus?"
        onConfirm={handleRetrySync}
        onCancel={() => {
          setRetrySyncDialogOpen(false);
          setRequestIdToRetry(null);
        }}
        confirmText="Retentar"
        cancelText="Cancelar"
        confirmColor="blue"
      />
    </div>
  );
};
