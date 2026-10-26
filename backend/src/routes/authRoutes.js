const express = require('express');
const { register, login, me, registerSchema, loginSchema } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', authenticateToken, me);

module.exports = router;
