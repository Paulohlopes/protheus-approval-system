import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import type { FormTemplate } from '../../types/registration';

export const SelectRegistrationTypePage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await registrationService.getTemplates(false);
      // Only show active templates
      setTemplates(data.filter((t) => t.isActive));
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Erro ao carregar tipos de cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/registration/new/${templateId}`);
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Novo Cadastro</h1>
      <p className="text-gray-600 mb-6">
        Selecione o tipo de cadastro que deseja realizar
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum tipo de cadastro disponível no momento.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className="bg-white p-6 rounded-lg shadow border border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  {template.tableName.substring(0, 2)}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{template.label}</h3>
              <p className="text-sm text-gray-600">Tabela: {template.tableName}</p>
              {template.description && (
                <p className="text-sm text-gray-500 mt-2">{template.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
