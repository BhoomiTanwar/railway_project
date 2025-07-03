const express = require('express');
const router = express.Router();
const { addTrain, getSeatAvailability, updateTrainSeats } = require('../controllers/trainController');
const { verifyAdminApiKey, verifyToken } = require('../middleware/auth');
const { validateTrainCreation, validateSeatAvailability } = require('../middleware/validation');

// POST /api/trains - Add a new train (Admin only with API key)
router.post('/', verifyAdminApiKey, validateTrainCreation, addTrain);

// GET /api/trains/availability - Get seat availability between stations
router.get('/availability', validateSeatAvailability, getSeatAvailability);

// PUT /api/trains/:train_id/seats - Update train seats (Admin only with API key)
router.put('/:train_id/seats', verifyAdminApiKey, updateTrainSeats);

module.exports = router;