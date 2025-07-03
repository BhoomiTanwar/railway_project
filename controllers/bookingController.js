const pool = require('../config/database');

// Book a seat (with race condition handling)
const bookSeat = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { train_id } = req.body;
    const user_id = req.user.id;

    // Lock the train row to prevent race conditions
    const trainResult = await client.query(
      `SELECT id, train_number, train_name, source_station, destination_station, 
              total_seats, available_seats 
       FROM trains 
       WHERE id = $1 
       FOR UPDATE`,
      [train_id]
    );

    if (trainResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    const train = trainResult.rows[0];

    // Check if seats are available
    if (train.available_seats <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No seats available on this train'
      });
    }

    // Check if user already has a booking on this train
    const existingBooking = await client.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND train_id = $2 AND booking_status = $3',
      [user_id, train_id, 'confirmed']
    );

    if (existingBooking.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You already have a confirmed booking on this train'
      });
    }

    // Calculate next seat number
    const seatResult = await client.query(
      'SELECT COALESCE(MAX(seat_number), 0) + 1 as next_seat FROM bookings WHERE train_id = $1',
      [train_id]
    );
    
    const seatNumber = seatResult.rows[0].next_seat;

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, train_id, seat_number, booking_status) 
       VALUES ($1, $2, $3, 'confirmed') 
       RETURNING id, seat_number, booking_status, created_at`,
      [user_id, train_id, seatNumber]
    );

    // Update available seats
    await client.query(
      'UPDATE trains SET available_seats = available_seats - 1 WHERE id = $1',
      [train_id]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Seat booked successfully',
      data: {
        booking_id: booking.id,
        train: {
          id: train.id,
          train_number: train.train_number,
          train_name: train.train_name,
          source_station: train.source_station,
          destination_station: train.destination_station
        },
        seat_number: booking.seat_number,
        booking_status: booking.booking_status,
        booked_at: booking.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        message: 'Seat already booked by another user. Please try again.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during booking'
      });
    }
  } finally {
    client.release();
  }
};

// Get specific booking details
const getBookingDetails = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    const result = await client.query(
      `SELECT b.id, b.seat_number, b.booking_status, b.created_at,
              t.train_number, t.train_name, t.source_station, t.destination_station,
              u.username, u.email
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [booking_id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have access to this booking'
      });
    }

    const booking = result.rows[0];

    res.json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: {
        booking_id: booking.id,
        train: {
          train_number: booking.train_number,
          train_name: booking.train_name,
          source_station: booking.source_station,
          destination_station: booking.destination_station
        },
        passenger: {
          username: booking.username,
          email: booking.email
        },
        seat_number: booking.seat_number,
        booking_status: booking.booking_status,
        booked_at: booking.created_at
      }
    });

  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking details'
    });
  } finally {
    client.release();
  }
};

// Get all user bookings
const getUserBookings = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const user_id = req.user.id;

    const result = await client.query(
      `SELECT b.id, b.seat_number, b.booking_status, b.created_at,
              t.train_number, t.train_name, t.source_station, t.destination_station
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      message: 'User bookings retrieved successfully',
      data: {
        total_bookings: result.rows.length,
        bookings: result.rows.map(booking => ({
          booking_id: booking.id,
          train: {
            train_number: booking.train_number,
            train_name: booking.train_name,
            source_station: booking.source_station,
            destination_station: booking.destination_station
          },
          seat_number: booking.seat_number,
          booking_status: booking.booking_status,
          booked_at: booking.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user bookings'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  bookSeat,
  getBookingDetails,
  getUserBookings
};