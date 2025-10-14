// ═══════════════════════════════════════════════════════════════
// 🔔 TEMPLATE EDITOR MODAL
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import templateService from '../services/notificationTemplateService';

const TemplateEditorModal = ({ template, onClose, onSuccess }) => {
  const isEdit = !!template;

  // Form state
  const [formData, setFormData] = useState({
    template_code: template?.template_code || '',
    template_name: template?.template_name || '',
    description: template?.description || '',
    category: template?.category || 'ticket',
    type: template?.type || '',
    priority: template?.priority || 'normal',
    title_template: template?.title_template || '',
    message_template: template?.message_template || '',
    variables: template?.variables || [],
    example_data: template?.example_data || {},
    channels: template?.channels || ['web', 'mobile'],
    icon: template?.icon || '',
    color: template?.color || '',
    action_url_template: template?.action_url_template || '',
    is_active: template?.is_active !== undefined ? template.is_active : true
  });

  const [newVariable, setNewVariable] = useState('');
  const [errors, setErrors] = useState({});

  // Extract variables from templates
  useEffect(() => {
    const extractVariables = (text) => {
      const regex = /\{\{(\w+)\}\}/g;
      const matches = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (!matches.includes(match[1])) {
          matches.push(match[1]);
        }
      }
      return matches;
    };

    const titleVars = extractVariables(formData.title_template);
    const messageVars = extractVariables(formData.message_template);
    const allVars = [...new Set([...titleVars, ...messageVars])];

    setFormData(prev => ({
      ...prev,
      variables: allVars
    }));
  }, [formData.title_template, formData.message_template]);

  // Save mutation
  const saveMutation = useMutation(
    (data) => isEdit ? templateService.update(template.id, data) : templateService.create(data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Template updated successfully' : 'Template created successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save template');
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.template_code) newErrors.template_code = 'Template code is required';
    if (!formData.template_name) newErrors.template_name = 'Template name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.title_template) newErrors.title_template = 'Title template is required';
    if (!formData.message_template) newErrors.message_template = 'Message template is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleChannelToggle = (channel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable],
        example_data: {
          ...prev.example_data,
          [newVariable]: ''
        }
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable),
      example_data: Object.fromEntries(
        Object.entries(prev.example_data).filter(([key]) => key !== variable)
      )
    }));
  };

  const updateExampleData = (variable, value) => {
    setFormData(prev => ({
      ...prev,
      example_data: {
        ...prev.example_data,
        [variable]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Code *
                </label>
                <input
                  type="text"
                  value={formData.template_code}
                  onChange={(e) => handleChange('template_code', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  disabled={isEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="TICKET_ASSIGNED"
                />
                {errors.template_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.template_code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => handleChange('template_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tiket Ditugaskan"
                />
                {errors.template_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.template_name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description of this template..."
              />
            </div>

            {/* Category & Type */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ticket">Ticket</option>
                  <option value="customer">Customer</option>
                  <option value="system">System</option>
                  <option value="payment">Payment</option>
                  <option value="technician">Technician</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ticket_assigned"
                />
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title Template * 
                  <span className="text-xs text-gray-500 ml-2">Use {{variable}} for placeholders</span>
                </label>
                <input
                  type="text"
                  value={formData.title_template}
                  onChange={(e) => handleChange('title_template', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Tiket Baru #{{ticket_number}}"
                />
                {errors.title_template && (
                  <p className="mt-1 text-sm text-red-600">{errors.title_template}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Template *
                  <span className="text-xs text-gray-500 ml-2">Use {{variable}} for placeholders</span>
                </label>
                <textarea
                  value={formData.message_template}
                  onChange={(e) => handleChange('message_template', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Anda mendapat tiket baru {{ticket_type}} untuk {{customer_name}}"
                />
                {errors.message_template && (
                  <p className="mt-1 text-sm text-red-600">{errors.message_template}</p>
                )}
              </div>
            </div>

            {/* Variables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variables (Auto-detected)
              </label>
              {formData.variables.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No variables detected. Use {{variable}} syntax in templates.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.variables.map(variable => (
                    <div key={variable} className="flex items-center space-x-2">
                      <span className="text-sm font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {`{{${variable}}}`}
                      </span>
                      <input
                        type="text"
                        value={formData.example_data[variable] || ''}
                        onChange={(e) => updateExampleData(variable, e.target.value)}
                        placeholder={`Example value for ${variable}`}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channels
              </label>
              <div className="flex flex-wrap gap-2">
                {['web', 'mobile', 'email', 'sms'].map(channel => (
                  <label key={channel} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel)}
                      onChange={() => handleChannelToggle(channel)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Lucide icon name)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleChange('icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="check-circle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="blue"
                />
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={saveMutation.isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={saveMutation.isLoading}
          >
            {saveMutation.isLoading ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorModal;

