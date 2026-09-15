const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

// Mount foundational routes
router.use('/health', healthRoutes);

module.exports = router;
