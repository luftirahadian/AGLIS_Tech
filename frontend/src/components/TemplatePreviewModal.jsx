// ═══════════════════════════════════════════════════════════════
// 🔔 TEMPLATE PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { X } from 'lucide-react';

const TemplatePreviewModal = ({ previewData, onClose }) => {
  const { template, preview } = previewData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Template Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Template Info</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">{template.template_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Code:</span>
                <span className="text-sm font-mono bg-gray-200 px-2 py-0.5 rounded">{template.template_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{template.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Priority:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{template.priority}</span>
              </div>
            </div>
          </div>

          {/* Preview with Example Data */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Rendered Output</h3>
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="mb-3">
                <label className="text-xs font-semibold text-blue-700 uppercase">Title</label>
                <p className="text-base font-semibold text-gray-900 mt-1">{preview.title}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-700 uppercase">Message</label>
                <p className="text-sm text-gray-800 mt-1">{preview.message}</p>
              </div>
              {preview.action_url && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <label className="text-xs font-semibold text-blue-700 uppercase">Action URL</label>
                  <p className="text-sm text-blue-600 mt-1 break-all">{preview.action_url}</p>
                </div>
              )}
            </div>
          </div>

          {/* Templates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Templates</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Title Template</label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">{template.title_template}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Message Template</label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">{template.message_template}</p>
              </div>
            </div>
          </div>

          {/* Example Data */}
          {template.example_data && Object.keys(template.example_data).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Example Data</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(template.example_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;

