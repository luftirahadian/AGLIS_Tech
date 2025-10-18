import React from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const BulkProgressModal = ({ 
  isOpen, 
  total, 
  processed, 
  succeeded, 
  failed, 
  currentItem,
  operation,
  onCancel 
}) => {
  if (!isOpen) return null;

  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isComplete = processed === total;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isComplete ? 'Operation Complete' : 'Processing...'}
          </h3>
          {isComplete && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{operation}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isComplete
                    ? failed > 0
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-blue-500 animate-pulse'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                {succeeded}
                {succeeded > 0 && <CheckCircle className="h-4 w-4 ml-1" />}
              </div>
              <div className="text-xs text-gray-500">Succeeded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
                {failed}
                {failed > 0 && <AlertCircle className="h-4 w-4 ml-1" />}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>

          {/* Current Item */}
          {!isComplete && currentItem && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>Processing: {currentItem}</span>
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <div className={`p-4 rounded-md ${
              failed > 0 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`text-sm font-medium ${
                failed > 0 ? 'text-yellow-800' : 'text-green-800'
              }`}>
                {failed > 0 
                  ? `Completed with ${failed} error${failed > 1 ? 's' : ''}` 
                  : 'All operations completed successfully!'}
              </p>
              {failed > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  Click to view detailed results
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isComplete && (
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkProgressModal;

