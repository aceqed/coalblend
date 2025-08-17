// src/utils/coalPdfParser.js
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Helper function to extract number after a label
function extractNumber(text, pattern) {
    const re = new RegExp(`${pattern}\\s*[:–-]?\\s*([0-9]+\\.?[0-9]*)`, 'i');
    const m = text.match(re);
    if (!m) return null;
    
    const num = parseFloat(m[1]);
    return isFinite(num) ? num : null;
  }

// Main function to parse coal PDF
export async function parseCoalPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Extract data using patterns
    return {
      coal_name: file.name.replace(/\.pdf$/i, '').trim(),
      IM: extractNumber(fullText, '(?:Inherent )?Moisture|IM'),
      Ash: extractNumber(fullText, 'Ash'),
      VM: extractNumber(fullText, '(?:Volatile Matter|VM)'),
      FC: extractNumber(fullText, '(?:Fixed Carbon|FC)'),
      S: extractNumber(fullText, '(?:Sulphur|Sulfur|S)'),
      P: extractNumber(fullText, '(?:Phosphorus|P)'),
      SiO2: extractNumber(fullText, 'SiO2'),
      Al2O3: extractNumber(fullText, 'Al2O3'),
      Fe2O3: extractNumber(fullText, 'Fe2O3'),
      CaO: extractNumber(fullText, 'CaO'),
      MgO: extractNumber(fullText, 'MgO'),
      Na2O: extractNumber(fullText, 'Na2O'),
      K2O: extractNumber(fullText, 'K2O'),
      TiO2: extractNumber(fullText, 'TiO2'),
      Mn3O4: extractNumber(fullText, 'Mn3O4'),
      SO3: extractNumber(fullText, 'SO3'),
      P2O5: extractNumber(fullText, 'P2O5'),
      CRI: extractNumber(fullText, 'CRI'),
      CSR: extractNumber(fullText, 'CSR'),
      N: extractNumber(fullText, '(?:Nitrogen|N)'),
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF');
  }
}