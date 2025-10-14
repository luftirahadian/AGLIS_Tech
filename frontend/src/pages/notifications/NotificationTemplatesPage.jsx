// ═══════════════════════════════════════════════════════════════
// 🔔 NOTIFICATION TEMPLATES MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, Edit2, Trash2, Eye, Copy, Filter, Search, 
  FileText, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import templateService from '../../services/notificationTemplateService';
import TemplateEditorModal from '../../components/TemplateEditorModal';
import TemplatePreviewModal from '../../components/TemplatePreviewModal';
import ConfirmationModal from '../../components/ConfirmationModal';

const NotificationTemplatesPage = () => {
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Fetch templates
  const { data: templatesData, isLoading, error } = useQuery(
    ['notification-templates', categoryFilter, activeFilter],
    () => templateService.getAll({
      category: categoryFilter || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'active'
    }),
    {
      refetchOnWindowFocus: false
    }
  );

  const templates = templatesData || [];

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => templateService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notification-templates');
        toast.success('Template berhasil dihapus');
        setShowDeleteModal(false);
        setSelectedTemplate(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menghapus template');
      }
    }
  );

  // Duplicate mutation
  const duplicateMutation = useMutation(
    async (template) => {
      const newTemplate = {
        ...template,
        template_code: `${template.template_code}_COPY`,
        template_name: `${template.name} (Copy)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined
      };
      return templateService.create(newTemplate);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notification-templates');
        toast.success('Template berhasil diduplikasi');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal menduplikasi template');
      }
    }
  );

  // Filter templates by search
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.template_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Handlers
  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowEditorModal(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowEditorModal(true);
  };

  const handlePreview = async (template) => {
    try {
      const result = await templateService.preview(template.id);
      setPreviewData(result.data);
      setShowPreviewModal(true);
    } catch (error) {
      toast.error('Gagal memuat preview');
    }
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const handleDuplicate = (template) => {
    duplicateMutation.mutate(template);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  // Get unique categories
  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];

  // Priority badge colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  // Category icon colors
  const categoryColors = {
    ticket: 'text-blue-600',
    customer: 'text-green-600',
    system: 'text-red-600',
    payment: 'text-purple-600',
    technician: 'text-yellow-600'
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Templates</h1>
            <p className="text-gray-600 mt-1">Manage reusable notification templates</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filter */}
          <div>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <span>{filteredTemplates.length} templates found</span>
          <span>•</span>
          <span>{templates.filter(t => t.is_active).length} active</span>
          <span>•</span>
          <span>{categories.length} categories</span>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || categoryFilter ? 'Try adjusting your filters' : 'Create your first notification template'}
          </p>
          {!searchTerm && !categoryFilter && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{template.template_name}</h3>
                      {template.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {template.template_code}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category] || 'text-gray-600'} bg-gray-100`}>
                        {template.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[template.priority]}`}>
                        {template.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Title Template</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 p-2 rounded">
                    {template.title_template}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Message Template</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-50 p-2 rounded">
                    {template.message_template}
                  </p>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Variables</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map(variable => (
                        <span key={variable} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreview(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showEditorModal && (
        <TemplateEditorModal
          template={selectedTemplate}
          onClose={() => {
            setShowEditorModal(false);
            setSelectedTemplate(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries('notification-templates');
            setShowEditorModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {showPreviewModal && previewData && (
        <TemplatePreviewModal
          previewData={previewData}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewData(null);
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Template"
          message={`Are you sure you want to delete "${selectedTemplate?.template_name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedTemplate(null);
          }}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default NotificationTemplatesPage;

