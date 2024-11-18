const { createWorker } = require('tesseract.js');
const pdf = require('pdf-parse');
const fs = require('fs').promises;

const extractNumberFromText = (text, parameter) => {
    // Common patterns for blood test values
    const patterns = {
        hemoglobin: /(?:hemoglobin|hgb|hb)[\s:]*(\d+\.?\d*)/i,
        wbc: /(?:wbc|white\s+blood\s+cells?)[\s:]*(\d+\.?\d*)/i,
        rbc: /(?:rbc|red\s+blood\s+cells?)[\s:]*(\d+\.?\d*)/i,
        platelets: /(?:platelets|plt)[\s:]*(\d+\.?\d*)/i
    };

    const match = text.match(patterns[parameter]);
    return match ? parseFloat(match[1]) : null;
};

exports.processFile = async (filePath) => {
    try {
        let text;
        if (filePath.toLowerCase().endsWith('.pdf')) {
            const dataBuffer = await fs.readFile(filePath);
            const pdfData = await pdf(dataBuffer);
            text = pdfData.text;
        } else {
            // For image files
            const worker = await createWorker();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            const { data: { text: ocrText } } = await worker.recognize(filePath);
            await worker.terminate();
            text = ocrText;
        }

        console.log('Extracted text:', text); // For debugging

        // Extract values
        const extractedData = {
            hemoglobin: extractNumberFromText(text, 'hemoglobin'),
            wbc: extractNumberFromText(text, 'wbc'),
            rbc: extractNumberFromText(text, 'rbc'),
            platelets: extractNumberFromText(text, 'platelets')
        };

        console.log('Extracted data:', extractedData); // For debugging

        return extractedData;
    } catch (error) {
        console.error('OCR processing error:', error);
        throw new Error('Failed to process file');
    }
}; 
};

const extractNumber = (text, regex) => {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
};

const analyzeValues = (data) => {
    const analysis = new Map();
    // Add basic analysis (example)
    if (data.hemoglobin) {
        analysis.set('hemoglobin', analyzeHemoglobin(data.hemoglobin));
    }
    return analysis;
};

const analyzeHemoglobin = (value) => {
    if (value < 12) return 'Low';
    if (value > 16) return 'High';
    return 'Normal';
};

module.exports = {
    processFile
}; 