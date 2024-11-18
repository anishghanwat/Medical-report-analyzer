const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    originalFile: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    extractedData: {
        hemoglobin: Number,
        wbc: Number,
        rbc: Number,
        platelets: Number
    },
    analysis: {
        type: Map,
        of: String
    },
    errorMessage: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema); 