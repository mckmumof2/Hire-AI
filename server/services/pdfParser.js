const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Extract pages from PDF as base64 images
 * Note: For true image extraction, we'd need pdf2pic or similar.
 * This returns a placeholder and relies on the uploaded images instead.
 */
async function extractPDFPagesAsImages(filePath) {
  // For Phase 1, we support direct image uploads for vision analysis.
  // PDF-to-image conversion requires native dependencies (GraphicsMagick, etc.)
  // that are complex to set up on Windows. 
  // We extract text from portfolio PDFs and analyze that.
  const textData = await extractTextFromPDF(filePath);
  return {
    text: textData.text,
    pages: textData.pages,
    images: [], // Would contain base64 page images with proper setup
    note: 'For vision analysis, upload portfolio pages as images (JPG/PNG)'
  };
}

/**
 * Read an image file as base64
 */
function readImageAsBase64(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const formatMap = {
    '.jpg': 'jpeg',
    '.jpeg': 'jpeg',
    '.png': 'png',
    '.webp': 'webp',
    '.gif': 'gif'
  };
  
  const format = formatMap[ext] || 'jpeg';
  const data = fs.readFileSync(filePath);
  
  return {
    data: data.toString('base64'),
    format,
    filename: path.basename(filePath)
  };
}

/**
 * Get all image files from a directory
 */
function getImagesFromDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const files = fs.readdirSync(dirPath);
  
  return files
    .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
    .map(f => readImageAsBase64(path.join(dirPath, f)));
}

module.exports = {
  extractTextFromPDF,
  extractPDFPagesAsImages,
  readImageAsBase64,
  getImagesFromDirectory
};
