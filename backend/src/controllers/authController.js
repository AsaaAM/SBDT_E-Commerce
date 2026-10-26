const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { queryWrite, queryRead } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth');

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Cek apakah email sudah terdaftar
    const existing = await queryRead('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Dapatkan ID berikutnya secara eksplisit dari coordinator agar replikasi Reference Table Citus konsisten di semua worker
    const seqRes = await queryWrite("SELECT nextval('users_id_seq') AS new_id");
    const newId = parseInt(seqRes.rows[0].new_id, 10);

    // Default role untuk registrasi mandiri adalah 'user'
    const result = await queryWrite(
      `INSERT INTO users (id, name, email, password_hash, role, phone, address)
       VALUES ($1, $2, $3, $4, 'user', $5, $6)
       RETURNING id, name, email, role, phone, address, created_at`,
      [newId, name, email, passwordHash, phone || null, address || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await queryRead(
      'SELECT id, name, email, password_hash, role, phone, address FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email dan password salah.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email dan password salah.',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password_hash;

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await queryRead(
      'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  registerSchema,
  loginSchema,
};
