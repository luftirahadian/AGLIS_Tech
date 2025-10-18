import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw, Download, ChevronDown, ChevronRight } from 'lucide-react';

const BulkResultsModal = ({ 
  isOpen, 
  results, 
  onClose, 
  onRetryFailed,
  operation 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState({});

  if (!isOpen || !results) return null;

  const { total, succeeded, failed, results: items = [] } = results;
  const failedItems = items.filter(item => !item.success);
  const succeededItems = items.filter(item => item.success);

  const toggleErrorDetails = (id) => {
    setExpandedErrors(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExportResults = () => {
    const csvContent = [
      ['ID', 'Status', 'Error'],
      ...items.map(item => [
        item.id,
        item.success ? 'Success' : 'Failed',
        item.error || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-operation-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Bulk Operation Results
            </h3>
            <p className="text-sm text-gray-500 mt-1">{operation}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500 mt-1">Total Items</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 flex items-center justify-center">
                {succeeded}
                <CheckCircle className="h-5 w-5 ml-2" />
              </div>
              <div className="text-sm text-green-700 mt-1">Succeeded</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600 flex items-center justify-center">
                {failed}
                <AlertCircle className="h-5 w-5 ml-2" />
              </div>
              <div className="text-sm text-red-700 mt-1">Failed</div>
            </div>
          </div>
        </div>

        {/* Results Details */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Toggle Details */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            <button
              onClick={handleExportResults}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Results
            </button>
          </div>

          {showDetails && (
            <div className="space-y-4">
              {/* Failed Items */}
              {failedItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Failed Items ({failedItems.length})
                  </h4>
                  <div className="space-y-2">
                    {failedItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-red-50 border border-red-200 rounded-md p-3"
                      >
                        <button
                          onClick={() => toggleErrorDetails(item.id)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <span className="text-sm font-medium text-red-900">
                            ID: {item.id}
                          </span>
                          {expandedErrors[item.id] ? (
                            <ChevronDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-red-600" />
                          )}
                        </button>
                        {expandedErrors[item.id] && (
                          <div className="mt-2 pt-2 border-t border-red-200">
                            <p className="text-xs text-red-700">
                              <span className="font-semibold">Error:</span> {item.error}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Succeeded Items */}
              {succeededItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Succeeded Items ({succeededItems.length})
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex flex-wrap gap-1">
                      {succeededItems.map((item, index) => (
                        <span 
                          key={item.id} 
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                        >
                          {item.id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Details Message */}
          {!showDetails && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Click "Show Details" to view individual results</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center gap-3 p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {failed === 0 ? (
              <span className="text-green-600 font-medium">✓ All operations successful</span>
            ) : (
              <span className="text-yellow-600 font-medium">⚠ {failed} operation{failed > 1 ? 's' : ''} failed</span>
            )}
          </div>
          <div className="flex gap-3">
            {failed > 0 && onRetryFailed && (
              <button
                onClick={() => {
                  onRetryFailed(failedItems.map(item => item.id));
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Failed
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkResultsModal;

