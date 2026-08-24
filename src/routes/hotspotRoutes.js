const express = require('express');
const { syncNasaData } = require('../controllers/hotspotController');

const router = express.Router();

// Endpoint: GET /api/hotspots/sync
router.get('/sync', syncNasaData);

module.exports = router;