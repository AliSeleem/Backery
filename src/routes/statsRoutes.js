const express = require('express');
const router = express.Router();
const { getOverviewStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/overview', protect, authorize('admin', 'manager'), getOverviewStats);

module.exports = router;
