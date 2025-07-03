const pool = require('../config/database');

// Add a new train (Admin only)
const addTrain = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { train_number, train_name, source_station, destination_station, total_seats } = req.body;

    // Check if train number already exists
    const existingTrain = await client.query(
      'SELECT id FROM trains WHERE train_number = $1',
      [train_number]
    );

    if (existingTrain.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Train with this number already exists'
      });
    }

    // Insert new train
    const result = await client.query(
      `INSERT INTO trains (train_number, train_name, source_station, destination_station, total_seats, available_seats) 
       VALUES ($1, $2, $3, $4, $5, $5) 
       RETURNING id, train_number, train_name, source_station, destination_station, total_seats, available_seats, created_at`,
      [train_number, train_name, source_station, destination_station, total_seats]
    );

    const newTrain = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Train added successfully',
      data: newTrain
    });

  } catch (error) {
    console.error('Add train error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding train'
    });
  } finally {
    client.release();
  }
};

// Get seat availability between stations
const getSeatAvailability = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { source, destination } = req.query;

    // Find all trains between source and destination
    const result = await client.query(
      `SELECT id, train_number, train_name, source_station, destination_station, 
              total_seats, available_seats, created_at
       FROM trains 
       WHERE LOWER(source_station) = LOWER($1) 
       AND LOWER(destination_station) = LOWER($2)
       ORDER BY train_name`,
      [source, destination]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No trains found between these stations'
      });
    }

    res.json({
      success: true,
      message: 'Trains found successfully',
      data: {
        route: {
          source: source,
          destination: destination
        },
        trains: result.rows
      }
    });

  } catch (error) {
    console.error('Get seat availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching seat availability'
    });
  } finally {
    client.release();
  }
};

// Update train seats (Admin only)
const updateTrainSeats = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { train_id } = req.params;
    const { total_seats } = req.body;

    // Check if train exists
    const trainResult = await client.query(
      'SELECT id, total_seats, available_seats FROM trains WHERE id = $1',
      [train_id]
    );

    if (trainResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    const train = trainResult.rows[0];
    const bookedSeats = train.total_seats - train.available_seats;

    if (total_seats < bookedSeats) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total seats below ${bookedSeats} (already booked seats)`
      });
    }

    const newAvailableSeats = total_seats - bookedSeats;

    // Update train
    const updateResult = await client.query(
      `UPDATE trains 
       SET total_seats = $1, available_seats = $2 
       WHERE id = $3 
       RETURNING id, train_number, train_name, source_station, destination_station, total_seats, available_seats`,
      [total_seats, newAvailableSeats, train_id]
    );

    res.json({
      success: true,
      message: 'Train seats updated successfully',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Update train seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating train seats'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  addTrain,
  getSeatAvailability,
  updateTrainSeats
};