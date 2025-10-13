import React, { useState } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useMutation } from 'react-query'
import userService from '../../services/userService'
import toast from 'react-hot-toast'

const ImportUsersModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [importData, setImportData] = useState([])
  const [validationResults, setValidationResults] = useState([])
  const [importing, setImporting] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      toast.error('Format file harus CSV atau Excel')
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
          toast.error('File kosong atau format tidak valid')
          return
        }

        // Validate and transform data
        const validated = jsonData.map((row, index) => {
          const errors = []
          
          if (!row.Username || row.Username.length < 3) {
            errors.push('Username invalid (min 3 chars)')
          }
          if (!row.Email || !row.Email.includes('@')) {
            errors.push('Email invalid')
          }
          if (!row['Full Name']) {
            errors.push('Full Name required')
          }
          if (!row.Role || !['admin', 'supervisor', 'technician', 'customer_service'].includes(row.Role.toLowerCase())) {
            errors.push('Role invalid')
          }
          if (!row.Password || row.Password.length < 6) {
            errors.push('Password invalid (min 6 chars)')
          }

          return {
            rowNumber: index + 2, // +2 for header row and 0-based index
            data: {
              username: row.Username?.trim(),
              email: row.Email?.trim(),
              full_name: row['Full Name']?.trim(),
              phone: row.Phone?.trim() || '',
              role: row.Role?.toLowerCase().trim(),
              password: row.Password?.trim(),
              is_active: row.Status?.toLowerCase() === 'inactive' ? false : true
            },
            errors,
            isValid: errors.length === 0
          }
        })

        setImportData(validated)
        setValidationResults(validated)
        
        const validCount = validated.filter(v => v.isValid).length
        const invalidCount = validated.filter(v => !v.isValid).length
        
        if (invalidCount > 0) {
          toast.warning(`${validCount} valid, ${invalidCount} invalid rows`)
        } else {
          toast.success(`${validCount} users ready to import`)
        }
      } catch (error) {
        toast.error('Gagal membaca file: ' + error.message)
      }
    }

    reader.readAsArrayBuffer(selectedFile)
  }

  const downloadTemplate = () => {
    const template = [
      {
        'Username': 'johndoe',
        'Full Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Phone': '081234567890',
        'Role': 'technician',
        'Password': 'password123',
        'Status': 'active'
      },
      {
        'Username': 'janedoe',
        'Full Name': 'Jane Doe',
        'Email': 'jane.doe@example.com',
        'Phone': '081234567891',
        'Role': 'customer_service',
        'Password': 'password456',
        'Status': 'active'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users Template')
    
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 10 }
    ]

    XLSX.writeFile(workbook, 'import-users-template.xlsx')
    toast.success('Template downloaded!')
  }

  const handleImport = async () => {
    const validUsers = importData.filter(item => item.isValid)
    
    if (validUsers.length === 0) {
      toast.error('Tidak ada user valid untuk diimport')
      return
    }

    if (!window.confirm(`Import ${validUsers.length} users?`)) {
      return
    }

    setImporting(true)
    let successCount = 0
    let failCount = 0
    const errors = []

    for (const item of validUsers) {
      try {
        await userService.create(item.data)
        successCount++
      } catch (error) {
        failCount++
        errors.push(`Row ${item.rowNumber}: ${error.response?.data?.message || 'Failed'}`)
      }
    }

    setImporting(false)

    if (successCount > 0) {
      toast.success(`${successCount} users berhasil diimport!`)
      onSuccess()
      if (failCount === 0) {
        onClose()
      }
    }

    if (failCount > 0) {
      toast.error(`${failCount} users gagal diimport`)
      console.error('Import errors:', errors)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Upload className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Import Users</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={importing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download template Excel/CSV</li>
              <li>Fill in user data (Username, Full Name, Email, Phone, Role, Password, Status)</li>
              <li>Upload file (Excel or CSV format)</li>
              <li>Review validation results</li>
              <li>Click "Import" to create users</li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Download Template</h3>
              <p className="text-sm text-gray-600">Get the Excel template with example data</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn-outline flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (CSV or Excel)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={importing}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV or XLSX up to 10MB</p>
                {file && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    ✓ {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Validation Results */}
          {validationResults.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Validation Results:</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationResults.map((item, idx) => (
                      <tr key={idx} className={item.isValid ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="px-4 py-2 text-sm">{item.rowNumber}</td>
                        <td className="px-4 py-2 text-sm">{item.data.username}</td>
                        <td className="px-4 py-2 text-sm">{item.data.email}</td>
                        <td className="px-4 py-2 text-sm">{item.data.role}</td>
                        <td className="px-4 py-2 text-sm">
                          {item.isValid ? (
                            <span className="inline-flex items-center text-xs text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-red-700" title={item.errors.join(', ')}>
                              <XCircle className="h-3 w-3 mr-1" />
                              {item.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-xs text-green-600 font-medium">Valid Rows</p>
                      <p className="text-2xl font-bold text-green-700">
                        {validationResults.filter(v => v.isValid).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-xs text-red-600 font-medium">Invalid Rows</p>
                      <p className="text-2xl font-bold text-red-700">
                        {validationResults.filter(v => !v.isValid).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Format */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-2">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Username</strong> - Minimal 3 karakter, unique</li>
                  <li><strong>Full Name</strong> - Nama lengkap user</li>
                  <li><strong>Email</strong> - Format email valid, unique</li>
                  <li><strong>Phone</strong> - Nomor telepon (optional)</li>
                  <li><strong>Role</strong> - admin, supervisor, technician, atau customer_service</li>
                  <li><strong>Password</strong> - Minimal 6 karakter</li>
                  <li><strong>Status</strong> - active atau inactive (default: active)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={downloadTemplate}
            className="btn-outline flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={importing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="btn-primary"
              disabled={importing || validationResults.filter(v => v.isValid).length === 0}
            >
              {importing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import {validationResults.filter(v => v.isValid).length} Users
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportUsersModal

