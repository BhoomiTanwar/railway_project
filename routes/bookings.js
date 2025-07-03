const express = require('express');
const router = express.Router();
const { bookSeat, getBookingDetails, getUserBookings } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// POST /api/bookings - Book a seat (Requires authentication)
router.post('/', verifyToken, validateBooking, bookSeat);

// GET /api/bookings/:booking_id - Get specific booking details (Requires authentication)
router.get('/:booking_id', verifyToken, getBookingDetails);

// GET /api/bookings - Get all user bookings (Requires authentication)
router.get('/', verifyToken, getUserBookings);

module.exports = router;