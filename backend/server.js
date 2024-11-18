const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFParser = require('pdf-parse');

const app = express();
app.use(cors());
app.use(express.json());

// Basic multer setup
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await PDFParser(dataBuffer);
        const text = data.text;

        // Extract CBC values with more precise patterns
        const results = {
            hemoglobin: extractValue(text, /Hemoglobin[\s\S]*?(\d+\.?\d*)\s*g\/dL/),
            pcv: extractValue(text, /Packed Cell Volume \(PCV\)[\s\S]*?(\d+\.?\d*)\s*%/),
            rbc: extractValue(text, /RBC Count[\s\S]*?(\d+\.?\d*)\s*mill\/mm3/),
            mcv: extractValue(text, /MCV[\s\S]*?(\d+\.?\d*)\s*fL/),
            mch: extractValue(text, /MCH[\s\S]*?(\d+\.?\d*)\s*pg/),
            mchc: extractValue(text, /MCHC[\s\S]*?(\d+\.?\d*)\s*g\/dL/),
            rdw: extractValue(text, /Red Cell Distribution Width[\s\S]*?(\d+\.?\d*)\s*%/),
            wbc: extractValue(text, /Total Leukocyte Count[\s\S]*?(\d+\.?\d*)\s*thou\/mm3/),
            platelets: extractValue(text, /Platelet Count[\s\S]*?(\d+\.?\d*)\s*thou\/mm3/),
            neutrophils: extractValue(text, /Segmented Neutrophils[\s\S]*?(\d+\.?\d*)\s*%/),
            lymphocytes: extractValue(text, /Lymphocytes[\s\S]*?(\d+\.?\d*)\s*%/),
            monocytes: extractValue(text, /Monocytes[\s\S]*?(\d+\.?\d*)\s*%/),
            eosinophils: extractValue(text, /Eosinophils[\s\S]*?(\d+\.?\d*)\s*%/),
            basophils: extractValue(text, /Basophils[\s\S]*?(\d+\.?\d*)\s*%/)
        };

        // Reference ranges from the report
        const ranges = {
            hemoglobin: { min: 13.00, max: 17.00, unit: 'g/dL' },
            pcv: { min: 40.00, max: 50.00, unit: '%' },
            rbc: { min: 4.50, max: 5.50, unit: 'mill/mm3' },
            mcv: { min: 83.00, max: 101.00, unit: 'fL' },
            mch: { min: 27.00, max: 32.00, unit: 'pg' },
            mchc: { min: 31.50, max: 34.50, unit: 'g/dL' },
            rdw: { min: 11.60, max: 14.00, unit: '%' },
            wbc: { min: 4.00, max: 10.00, unit: 'thou/mm3' },
            platelets: { min: 150.00, max: 410.00, unit: 'thou/mm3' },
            neutrophils: { min: 40.00, max: 80.00, unit: '%' },
            lymphocytes: { min: 20.00, max: 40.00, unit: '%' },
            monocytes: { min: 2.00, max: 10.00, unit: '%' },
            eosinophils: { min: 1.00, max: 6.00, unit: '%' },
            basophils: { min: 0, max: 2.00, unit: '%' }
        };

        // Generate analysis with actual values from your report
        const analysis = {};
        for (const [param, value] of Object.entries(results)) {
            if (value !== null) {
                const range = ranges[param];
                analysis[param] = {
                    value: value,
                    unit: range.unit,
                    range: `${range.min}-${range.max}`,
                    status: getStatus(value, range.min, range.max)
                };
            }
        }

        res.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

function extractValue(text, regex) {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
}

// Update the analysis to show borderline values
function getStatus(value, min, max) {
    if (value < min) return 'Low';
    if (value > max) return 'High';
    // Check for borderline values (within 2% of range limits)
    const range = max - min;
    const threshold = range * 0.02;
    if (Math.abs(value - min) <= threshold) return 'Borderline Low';
    if (Math.abs(value - max) <= threshold) return 'Borderline High';
    return 'Normal';
}

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 