const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    fileName: String,
    originalFile: String,
    fileType: String,
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    extractedData: {
        hemoglobin: Number,
        pcv: Number,
        rbc: Number,
        mcv: Number,
        mch: Number,
        mchc: Number,
        rdw: Number,
        wbc: Number,
        platelets: Number
    },
    analysis: {
        recommendations: String,
        abnormalParameters: [{
            parameter: String,
            value: Number,
            status: String,
            severity: String
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        laboratoryName: String,
        testDate: Date,
        patientDetails: {
            age: Number,
            gender: String
        }
    }
});

// Add index for better query performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ status: 1 });

// Add a method to check if all required parameters are extracted
reportSchema.methods.isComplete = function () {
    const requiredParams = [
        'hemoglobin',
        'wbc',
        'rbc',
        'platelets'
    ];

    return requiredParams.every(param =>
        this.extractedData && this.extractedData[param] !== undefined
    );
};

module.exports = mongoose.model('Report', reportSchema); 