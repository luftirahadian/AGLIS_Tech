import React, { memo } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

/**
 * Beautiful Reusable Confirmation Modal
 * 
 * @param {boolean} isOpen - Control modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler
 * @param {string} title - Modal title
 * @param {string} message - Main message
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @param {string} type - Modal type: 'danger', 'warning', 'success', 'info' (default: 'info')
 * @param {boolean} isLoading - Loading state for confirm button
 */
const ConfirmationModal = memo(({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'info',
  isLoading = false,
  children
}) => {
  if (!isOpen) return null

  // Icon and color config based on type
  const config = {
    danger: {
      icon: AlertCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      borderColor: 'border-yellow-200'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-green-200'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      borderColor: 'border-blue-200'
    }
  }

  const currentConfig = config[type] || config.info
  const Icon = currentConfig.icon

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      ></div>

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Trick to center modal vertically */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Close Button */}
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${currentConfig.bgColor} sm:mx-0 sm:h-10 sm:w-10`}>
                <Icon className={`h-6 w-6 ${currentConfig.iconColor}`} />
              </div>

              {/* Text Content */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 pr-8">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                  {children && (
                    <div className="mt-3">
                      {children}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            {/* Confirm Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${currentConfig.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
});

ConfirmationModal.displayName = 'ConfirmationModal';

export default ConfirmationModal

