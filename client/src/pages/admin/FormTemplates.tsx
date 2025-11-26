import { useState, useEffect } from 'react';
import { registrationService } from '../../services/registrationService';
import type { FormTemplate } from '../../types/registration';

export const FormTemplatesPage = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tableName, setTableName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await registrationService.getTemplates(false);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrationService.createTemplate({
        tableName: tableName.toUpperCase(),
        label,
        description,
      });
      alert('Template criado com sucesso!');
      setShowCreateModal(false);
      setTableName('');
      setLabel('');
      setDescription('');
      await loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Erro ao criar template');
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Form Templates</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Criar Template
        </button>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum template encontrado. Crie um template para começar.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-4 rounded-lg shadow border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{template.label}</h3>
                  <p className="text-sm text-gray-600">Tabela: {template.tableName}</p>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/admin/form-templates/${template.id}`}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Editar Campos
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Criar Template</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tabela do Protheus</label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="SB1, SA1, SA2, etc."
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: SB1 (Produtos), SA1 (Clientes), SA2 (Fornecedores)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nome do Template</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Cadastro de Produtos"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do template"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
