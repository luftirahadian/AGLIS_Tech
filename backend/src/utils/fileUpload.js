const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Base upload directory
 */
const UPLOAD_BASE_DIR = path.join(__dirname, '../../uploads');

/**
 * Ensure upload directories exist
 */
const ensureUploadDirs = () => {
  const dirs = [
    path.join(UPLOAD_BASE_DIR, 'tickets/otdr'),
    path.join(UPLOAD_BASE_DIR, 'tickets/attenuation'),
    path.join(UPLOAD_BASE_DIR, 'tickets/modem_sn')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename with timestamp and random hash
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  return `${timestamp}_${randomHash}_${baseName}${ext}`;
};

/**
 * Save base64 image to disk
 * @param {Object} fileData - Object with { filename, data } where data is base64 string
 * @param {string} category - File category (otdr, attenuation, modem_sn)
 * @param {number} ticketId - Ticket ID for organization
 * @returns {Promise<string>} - Saved file path relative to uploads directory
 */
const saveBase64File = async (fileData, category, ticketId) => {
  ensureUploadDirs();

  if (!fileData || !fileData.data) {
    throw new Error('No file data provided');
  }

  // Extract base64 data (remove data:image/xxx;base64, prefix if exists)
  const base64Data = fileData.data.replace(/^data:image\/\w+;base64,/, '');
  
  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(fileData.filename);
  
  // Create subdirectory for ticket
  const ticketDir = path.join(UPLOAD_BASE_DIR, `tickets/${category}`, `ticket_${ticketId}`);
  if (!fs.existsSync(ticketDir)) {
    fs.mkdirSync(ticketDir, { recursive: true });
  }

  // Full file path
  const filePath = path.join(ticketDir, uniqueFilename);
  
  // Write file to disk
  fs.writeFileSync(filePath, base64Data, 'base64');

  // Return relative path from uploads directory
  const relativePath = path.relative(UPLOAD_BASE_DIR, filePath);
  return relativePath.replace(/\\/g, '/'); // Normalize path separators
};

/**
 * Delete file from disk
 * @param {string} relativePath - File path relative to uploads directory
 * @returns {boolean} - Success status
 */
const deleteFile = (relativePath) => {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get file URL from relative path
 * @param {string} relativePath - File path relative to uploads directory
 * @returns {string} - URL to access file
 */
const getFileUrl = (relativePath) => {
  if (!relativePath) return null;
  return `/uploads/${relativePath}`;
};

/**
 * Validate file size and type
 * @param {Object} fileData - Object with { filename, data }
 * @param {number} maxSizeMB - Max file size in MB
 * @returns {Object} - { valid: boolean, error: string }
 */
const validateFile = (fileData, maxSizeMB = 5) => {
  if (!fileData || !fileData.data) {
    return { valid: false, error: 'No file data provided' };
  }

  // Check file type by extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(fileData.filename).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` 
    };
  }

  // Check file size (base64 is ~33% larger than actual file)
  const base64Data = fileData.data.replace(/^data:image\/\w+;base64,/, '');
  const fileSizeInBytes = (base64Data.length * 3) / 4;
  const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

  if (fileSizeInMB > maxSizeMB) {
    return { 
      valid: false, 
      error: `File too large. Max size: ${maxSizeMB}MB, Your file: ${fileSizeInMB.toFixed(2)}MB` 
    };
  }

  return { valid: true };
};

module.exports = {
  ensureUploadDirs,
  generateUniqueFilename,
  saveBase64File,
  deleteFile,
  getFileUrl,
  validateFile,
  UPLOAD_BASE_DIR
};

