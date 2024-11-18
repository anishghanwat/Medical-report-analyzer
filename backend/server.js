const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend server is running!' });
});

// File upload route
app.post('/api/reports/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            report: {
                fileName: req.file.originalname,
                path: req.file.path,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
});

// Analyze route
app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Sample analysis result (replace with your actual analysis logic)
        const analysisResult = {
            extractedData: {
                hemoglobin: 14.5,
                wbc: 7.2,
                rbc: 4.9,
                platelets: 250
            },
            status: 'completed'
        };

        res.json(analysisResult);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/healthscope', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
}); 