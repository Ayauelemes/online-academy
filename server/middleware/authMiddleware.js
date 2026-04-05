const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access only' });
    }
    next();
}

function teacherOnly(req, res, next) {
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Teacher access only' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly, teacherOnly };