const Report = require('../models/Report');
const ocrService = require('../services/ocrService');
const fs = require('fs').promises;

exports.uploadReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create initial report entry
        const report = new Report({
            originalFile: req.file.path,
            status: 'processing'
        });

        await report.save();

        // Start processing asynchronously
        processReportAsync(report._id);

        res.status(201).json({
            message: 'Report uploaded successfully',
            report: {
                id: report._id,
                status: report.status,
                createdAt: report.createdAt
            }
        });
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        console.error('Upload error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Asynchronous processing function
async function processReportAsync(reportId) {
    try {
        const report = await Report.findById(reportId);
        if (!report) return;

        const { extractedData, analysis } = await ocrService.processFile(report.originalFile);

        report.extractedData = extractedData;
        report.analysis = analysis;
        report.status = 'completed';
        await report.save();
    } catch (error) {
        console.error(`Error processing report ${reportId}:`, error);
        await Report.findByIdAndUpdate(reportId, {
            status: 'failed',
            errorMessage: error.message
        });
    }
}

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getReport = async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            user: req.user._id
        }).select('-__v');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Delete the file from storage
        if (report.originalFile) {
            await fs.unlink(report.originalFile).catch(console.error);
        }

        await report.deleteOne();

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 