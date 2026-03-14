const jwt = require('jsonwebtoken');
const { create } = require('../models/user');
const auth = (req, res, next) => {
    const whitelist = ['/', 'register', 'login'];
    if (whitelist.find(item => '/v1/api/' + item === req.originalUrl)) {
        return next();
    } else {
        if (req?.headers?.authorization?.split(' ')[1]) {
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    email: decoded.email,
                    name: decoded.name,
                    createBy:"kien"
                };
                next()
            } catch (error) {
                return res.status(401).json({
                    EC: 1,
                    message: "Unauthorized"
                })
            }
        } else {
            return res.status(401).json({
                EC: 1,
                message: "Unauthorized"
            })
        }
    }
};

module.exports = auth;