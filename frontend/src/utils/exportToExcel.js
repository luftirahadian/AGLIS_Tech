import * as XLSX from 'xlsx'

/**
 * Export data to Excel with professional styling
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Base filename (without extension)
 * @param {String} sheetName - Name of the Excel sheet
 * @param {Object} options - Additional options
 */
export const exportToExcel = (data, filename, sheetName = 'Data', options = {}) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Get column headers
    const headers = Object.keys(data[0] || {})
    
    // Auto-fit column widths (professional sizing)
    const colWidths = headers.map(key => {
      const headerLength = key.length
      const maxDataLength = Math.max(
        ...data.map(row => {
          const value = String(row[key] || '')
          return value.length
        })
      )
      // Use the larger of header or max data length, with min 10 and max 50
      return {
        wch: Math.min(Math.max(headerLength, maxDataLength, 10), 50)
      }
    })
    ws['!cols'] = colWidths
    
    // Freeze header row (professional touch)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_')
    const finalFilename = `${filename}_${timestamp}.xlsx`
    
    // Download file
    XLSX.writeFile(wb, finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
      rows: data.length
    }
  } catch (error) {
    console.error('Export to Excel error:', error)
    throw error
  }
}

/**
 * Export data to Excel with multiple sheets
 * @param {Array} sheets - Array of {data, sheetName} objects
 * @param {String} filename - Base filename
 */
export const exportToExcelMultiSheet = (sheets, filename) => {
  try {
    if (!sheets || sheets.length === 0) {
      throw new Error('No sheets to export')
    }

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Add each sheet
    sheets.forEach(({ data, sheetName }) => {
      if (data && data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data)
        
        // Auto-fit columns
        const headers = Object.keys(data[0] || {})
        const colWidths = headers.map(key => {
          const headerLength = key.length
          const maxDataLength = Math.max(
            ...data.map(row => String(row[key] || '').length)
          )
          return {
            wch: Math.min(Math.max(headerLength, maxDataLength, 10), 50)
          }
        })
        ws['!cols'] = colWidths
        ws['!freeze'] = { xSplit: 0, ySplit: 1 }
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
    })
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_')
    const finalFilename = `${filename}_${timestamp}.xlsx`
    
    // Download
    XLSX.writeFile(wb, finalFilename)
    
    return {
      success: true,
      filename: finalFilename,
      sheets: sheets.length
    }
  } catch (error) {
    console.error('Export multi-sheet error:', error)
    throw error
  }
}

/**
 * Format currency for display in Excel
 */
export const formatCurrency = (amount) => {
  if (!amount) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format date for display in Excel
 */
export const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date only (no time)
 */
export const formatDateOnly = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export default {
  exportToExcel,
  exportToExcelMultiSheet,
  formatCurrency,
  formatDate,
  formatDateOnly
}

