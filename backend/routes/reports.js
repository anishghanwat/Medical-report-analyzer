const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const upload = require('../middleware/upload');

// Routes
router.post('/upload', upload.single('file'), reportController.uploadReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router; 