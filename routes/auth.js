const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

console.log("✅ authRoutes loaded");

router.get('/test', (req, res) => {
  res.json({ message: 'Auth test route working!' });
});

router.post('/register', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);

module.exports = router;
