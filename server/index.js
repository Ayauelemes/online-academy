const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});



async function initializeTables() {
    try {
        console.log('📊 Кестелерді құруда...');

        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ users');

        await pool.query(`
          CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER DEFAULT 0,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ courses');

        await pool.query(`
          CREATE TABLE IF NOT EXISTS lessons (
            id SERIAL PRIMARY KEY,
            course_id INTEGER NOT NULL REFERENCES courses(id),
            title TEXT NOT NULL,
            content TEXT,
            order_number INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ lessons');

        await pool.query(`
          CREATE TABLE IF NOT EXISTS enrollments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            course_id INTEGER NOT NULL REFERENCES courses(id),
            status TEXT DEFAULT 'active',
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, course_id)
          );
        `);
        console.log('✅ enrollments');

        await pool.query(`
          CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount INTEGER NOT NULL,
            month_name TEXT,
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'paid'
          );
        `);
        console.log('✅ payments');

        await pool.query(`
          CREATE TABLE IF NOT EXISTS freezes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            freeze_days INTEGER DEFAULT 30,
            used_days INTEGER DEFAULT 0,
            frozen_dates TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        console.log('✅ freezes');

// index.js - initializeTables() ішіне қосыңыз:

        await pool.query(`
            CREATE TABLE IF NOT EXISTS homework (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                student_email TEXT NOT NULL,
                homework_url TEXT,
                status TEXT DEFAULT 'pending',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ homework');
        console.log('✅ Барлық кестелер құрылды!');
    } catch (err) {
        console.error('❌ Қате:', err.message);
    }
}

initializeTables();


const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
};

const teacherOnly = (req, res, next) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Teacher only' });
    next();
};

app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role FROM users WHERE role = $1 ORDER BY id', ['student']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hash, 'student']
        );
        const user = result.rows[0];
        await pool.query('INSERT INTO freezes (user_id, freeze_days) VALUES ($1, $2)', [user.id, 30]);
        const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
        res.status(201).json({ id: user.id, email: user.email, role: user.role, token });
    } catch (err) {
        res.status(400).json({ error: 'Email already registered' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        let role = user.role || 'student';
        if (email === 'admin@mail.ru') role = 'admin';
        else if (email === 'teacher@mail.ru') role = 'teacher';
        const token = jwt.sign({ email: user.email, role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
        res.json({ message: 'Success', user: { id: user.id, email: user.email, role }, token });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/enroll', authMiddleware, async (req, res) => {
    const { course_id } = req.body;
    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        const user_id = userResult.rows[0].id;
        const result = await pool.query('INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, $3) RETURNING *', [user_id, course_id, 'active']);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: 'Already enrolled' });
    }
});

app.get('/api/my-courses', authMiddleware, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        const user_id = userResult.rows[0]?.id;
        if (!user_id) return res.status(404).json({ error: 'User not found' });
        const result = await pool.query(`
            SELECT c.id, c.name, c.description, c.price, c.image_url, e.status
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = $1
        `, [user_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/payment', authMiddleware, async (req, res) => {
    const { amount, month_name } = req.body;
    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        const user_id = userResult.rows[0].id;
        const result = await pool.query('INSERT INTO payments (user_id, amount, month_name, status) VALUES ($1, $2, $3, $4) RETURNING *', [user_id, amount, month_name, 'paid']);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/payments', authMiddleware, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        const user_id = userResult.rows[0]?.id;
        const result = await pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_date DESC', [user_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/freeze-info', authMiddleware, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        const user_id = userResult.rows[0]?.id;
        const result = await pool.query('SELECT freeze_days, frozen_dates FROM freezes WHERE user_id = $1', [user_id]);
        res.json(result.rows[0] || { freeze_days: 30, frozen_dates: [] });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/use-freeze', authMiddleware, async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [req.user.email]);
        const user_id = userResult.rows[0].id;
        const freezeResult = await pool.query('SELECT * FROM freezes WHERE user_id = $1', [user_id]);
        const freeze = freezeResult.rows[0];
        if (!freeze || freeze.freeze_days <= 0) return res.status(400).json({ error: 'No freeze days available' });
        const today = new Date().toISOString().split('T')[0];
        const frozen_dates = freeze.frozen_dates || [];
        frozen_dates.push(today);
        await pool.query('UPDATE freezes SET freeze_days = freeze_days - 1, used_days = used_days + 1, frozen_dates = $1 WHERE user_id = $2', [frozen_dates, user_id]);
        res.json({ message: 'Freeze day used', remaining: freeze.freeze_days - 1 });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const paymentsResult = await pool.query('SELECT SUM(amount) as total FROM payments');
        res.json({ users: parseInt(usersResult.rows[0].count), revenue: parseInt(paymentsResult.rows[0].total) || 0 });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/teacher/students', authMiddleware, teacherOnly, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role FROM users WHERE role = $1', ['student']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/update-task', async (req, res) => {
    const { email, status } = req.body;
    try {
        await pool.query('UPDATE users SET homework_status = $1 WHERE email = $2', [status, email]);
        res.json({ message: "Status updated" });
    } catch (err) {
        res.status(500).json({ error: 'Error' });
    }
});
// Студенттің толық деректерін алу (6 кестенің біріктіруі)
app.get('/api/student-complete-data', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.email,
                u.role,
                c.id as course_id,
                c.name as course_name,
                c.price,
                l.id as lesson_id,
                l.title as lesson_title,
                e.status as enrollment_status,
                p.amount as payment_amount,
                p.payment_date,
                f.freeze_days,
                f.used_days
            FROM users u
            LEFT JOIN enrollments e ON u.id = e.user_id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN lessons l ON c.id = l.course_id
            LEFT JOIN payments p ON u.id = p.user_id
            LEFT JOIN freezes f ON u.id = f.user_id
            WHERE u.email = $1
            ORDER BY c.id, l.order_number
        `, [req.user.email]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// КУРСТАРДЫ ҚОСУ
app.post('/api/courses', authMiddleware, adminOnly, async (req, res) => {
    const { name, price, image_url, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO courses (name, price, image_url, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, price, image_url, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: 'Error adding course' });
    }
});

// КУРСТЫ ӨШІРУ
app.delete('/api/courses/:id', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting course' });
    }
});

// ПАЙДАЛАНУШЫНЫҢ РӨЛІН ӨЗГЕРТУ
app.put('/api/users/:id/role', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            [role, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error updating role' });
    }
});

// ТӨЛЕМ ТАРИХЫ
app.get('/api/admin/payments', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.email, p.amount, p.month_name, p.payment_date
            FROM payments p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.payment_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/api/submit-task', authMiddleware, async (req, res) => {
    const { homework_url } = req.body; 
    
    if (!homework_url) return res.status(400).json({ error: 'Сілтеме қажет' });

    try {
        const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [req.user.email]);
        const user = userResult.rows[0];

        const result = await pool.query(
            'INSERT INTO homework (user_id, student_email, homework_url, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [user.id, user.email, homework_url, 'pending']
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/teacher/homework', authMiddleware, teacherOnly, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                user_id,
                student_email,
                homework_url,
                status,
                submitted_at
            FROM homework
            ORDER BY submitted_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/teacher/approve-homework', authMiddleware, teacherOnly, async (req, res) => {
    const { homework_id, status } = req.body; // status: 'approved' немесе 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE homework SET status = $1 WHERE id = $2 RETURNING *',
            [status, homework_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Homework not found' });
        }
        
        res.json({ success: true, message: `Homework ${status}`, data: result.rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/submit-homework', authMiddleware, async (req, res) => {
    const { homework_url } = req.body; 
    
    if (!homework_url) return res.status(400).json({ error: 'Сілтеме бос!' });

    try {
        const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [req.user.email]);
        const user = userResult.rows[0];

        const result = await pool.query(
            'INSERT INTO homework (user_id, student_email, homework_url, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [user.id, user.email, homework_url, 'pending']
        );
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Серверде қате болды' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

module.exports = app;
