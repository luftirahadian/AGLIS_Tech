import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { MessageSquare, Plus, Edit, Trash2, Eye, Copy, Check, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const WhatsAppTemplatesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ticket',
    description: '',
    template: '',
    variables: '{}',
    is_active: true
  });

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery(
    ['whatsapp-templates', categoryFilter, searchTerm],
    async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/whatsapp-templates?${params.toString()}`);
      return response.data;
    },
    {
      staleTime: 60000
    }
  );

  const templates = templatesData?.data || [];

  // Mutations
  const createMutation = useMutation(
    (data) => api.post('/whatsapp-templates', data),
    {
      onSuccess: () => {
        toast.success('Template created successfully!');
        queryClient.invalidateQueries(['whatsapp-templates']);
        setShowModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create template');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/whatsapp-templates/${id}`, data),
    {
      onSuccess: () => {
        toast.success('Template updated successfully!');
        queryClient.invalidateQueries(['whatsapp-templates']);
        setShowModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update template');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/whatsapp-templates/${id}`),
    {
      onSuccess: () => {
        toast.success('Template deleted successfully!');
        queryClient.invalidateQueries(['whatsapp-templates']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete template');
      }
    }
  );

  // Handlers
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: 'ticket',
      description: '',
      template: '',
      variables: '{}',
      is_active: true
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      code: template.code,
      name: template.name,
      category: template.category,
      description: template.description || '',
      template: template.template,
      variables: JSON.stringify(template.variables || {}, null, 2),
      is_active: template.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      variables: JSON.parse(formData.variables)
    };

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const categories = [
    { value: 'all', label: 'All Categories', color: 'gray' },
    { value: 'ticket', label: 'Ticket', color: 'blue' },
    { value: 'payment', label: 'Payment', color: 'green' },
    { value: 'customer', label: 'Customer', color: 'purple' },
    { value: 'team', label: 'Team', color: 'orange' },
    { value: 'marketing', label: 'Marketing', color: 'pink' }
  ];

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="h-7 w-7 mr-3 text-green-600" />
              WhatsApp Message Templates
            </h1>
            <p className="text-gray-600 mt-1">Kelola template pesan WhatsApp untuk notifikasi otomatis</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === cat.value
                    ? `bg-${cat.color}-100 text-${cat.color}-700 border border-${cat.color}-300`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-700`}>
                {template.category}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description || 'No description'}</p>
            
            <div className="bg-gray-50 rounded p-3 mb-4">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap line-clamp-4">
                {template.template}
              </pre>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              <div>Code: <span className="font-mono font-semibold">{template.code}</span></div>
              {template.usage_count > 0 && (
                <div>Used: {template.usage_count} times</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreview(template)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">Create your first WhatsApp message template</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Template
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                    placeholder="TICKET_ASSIGNMENT"
                    required
                    disabled={!!selectedTemplate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="ticket">Ticket</option>
                    <option value="payment">Payment</option>
                    <option value="customer">Customer</option>
                    <option value="team">Team</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ticket Assignment - Teknisi"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notifikasi assignment tiket ke teknisi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template *
                </label>
                <textarea
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="📩 *TIKET BARU*&#10;&#10;Ticket: #{{ticketNumber}}&#10;Customer: {{customerName}}"
                  required
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{variableName}}`} for dynamic content. Example: {`{{customerName}}, {{ticketNumber}}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variables (JSON)
                </label>
                <textarea
                  value={formData.variables}
                  onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  placeholder='{"customerName": "Bapak Rizki", "ticketNumber": "TKT001"}'
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON object dengan example values untuk testing
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active (template akan digunakan oleh sistem)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {selectedTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Template Preview</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedTemplate.name}</p>
            </div>

            <div className="p-6">
              {/* Phone Mockup */}
              <div className="mx-auto max-w-sm bg-gradient-to-b from-green-50 to-green-100 rounded-3xl p-4 shadow-lg">
                <div className="bg-white rounded-2xl p-4 shadow-inner">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">AGLIS Net</div>
                      <div className="text-xs text-gray-500">Online</div>
                    </div>
                  </div>

                  <div className="bg-green-100 rounded-lg rounded-tl-none p-3 mb-2">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                      {selectedTemplate.template}
                    </pre>
                  </div>

                  <div className="text-right text-xs text-gray-500">
                    {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Variables Info */}
              {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Available Variables:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedTemplate.variables).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-mono font-semibold text-green-600">{`{{${key}}}`}</span>
                        <span className="text-gray-600"> = {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplatesPage;

