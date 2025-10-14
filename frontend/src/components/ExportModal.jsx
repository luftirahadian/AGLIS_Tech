import React, { useState } from 'react'
import { X, Download, FileSpreadsheet, FileText, Check } from 'lucide-react'

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  totalCount = 0,
  filteredCount = 0,
  selectedCount = 0,
  availableColumns = []
}) => {
  const [exportType, setExportType] = useState('filtered') // all, filtered, selected
  const [exportFormat, setExportFormat] = useState('xlsx') // xlsx, csv
  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.filter(col => col.defaultSelected !== false).map(col => col.key)
  )
  const [isExporting, setIsExporting] = useState(false)

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(k => k !== columnKey)
      } else {
        return [...prev, columnKey]
      }
    })
  }

  const handleSelectAllColumns = () => {
    setSelectedColumns(availableColumns.map(col => col.key))
  }

  const handleDeselectAllColumns = () => {
    setSelectedColumns([])
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      alert('Pilih minimal 1 kolom untuk di-export')
      return
    }

    setIsExporting(true)
    try {
      await onExport({
        type: exportType,
        format: exportFormat,
        columns: selectedColumns
      })
    } finally {
      setIsExporting(false)
      onClose()
    }
  }

  if (!isOpen) return null

  const exportOptions = [
    {
      value: 'all',
      label: 'All Customers',
      description: `Export semua ${totalCount} customers`,
      disabled: totalCount === 0
    },
    {
      value: 'filtered',
      label: 'Filtered Customers',
      description: `Export ${filteredCount} customers yang di-filter`,
      disabled: filteredCount === 0
    },
    {
      value: 'selected',
      label: 'Selected Customers Only',
      description: `Export ${selectedCount} customers yang dipilih`,
      disabled: selectedCount === 0
    }
  ]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border max-w-3xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">📊 Export Customers</h3>
            <p className="text-sm text-gray-600 mt-1">
              Customize your export options
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              1. Pilih Data yang Akan Di-export
            </label>
            <div className="space-y-2">
              {exportOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setExportType(option.value)}
                  disabled={option.disabled || isExporting}
                  className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                    exportType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        exportType === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {exportType === option.value && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                2. Pilih Kolom yang Akan Di-export
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  disabled={isExporting}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllColumns}
                  disabled={isExporting}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableColumns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    disabled={isExporting}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedColumns.length} dari {availableColumns.length} kolom dipilih
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              3. Pilih Format File
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                disabled={isExporting}
                className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                  exportFormat === 'xlsx'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className={`h-6 w-6 mx-auto mb-1 ${
                  exportFormat === 'xlsx' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className="text-sm font-medium text-gray-900">Excel (.xlsx)</p>
                <p className="text-xs text-gray-500">Recommended</p>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                disabled={isExporting}
                className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                  exportFormat === 'csv'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className={`h-6 w-6 mx-auto mb-1 ${
                  exportFormat === 'csv' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className="text-sm font-medium text-gray-900">CSV (.csv)</p>
                <p className="text-xs text-gray-500">For data analysis</p>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportModal

