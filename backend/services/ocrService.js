const tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

const processFile = async (filePath) => {
    try {
        const fileExt = filePath.split('.').pop().toLowerCase();
        let text;

        if (fileExt === 'pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const pdfData = await pdfParse(dataBuffer);
            text = pdfData.text;
        } else {
            const { data: { text: extractedText } } = await tesseract.recognize(filePath);
            text = extractedText;
        }

        // Extract values (simplified example)
        const extractedData = {
            hemoglobin: extractNumber(text, /hemoglobin[:\s]+(\d+\.?\d*)/i),
            wbc: extractNumber(text, /wbc[:\s]+(\d+\.?\d*)/i),
            rbc: extractNumber(text, /rbc[:\s]+(\d+\.?\d*)/i),
            platelets: extractNumber(text, /platelets[:\s]+(\d+\.?\d*)/i)
        };

        return {
            extractedData,
            analysis: analyzeValues(extractedData)
        };
    } catch (error) {
        console.error('OCR processing error:', error);
        throw new Error('Failed to process file');
    }
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