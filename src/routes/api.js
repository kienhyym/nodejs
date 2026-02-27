const express = require('express');
const { route } = require('express/lib/application');
const router = require('express/lib/router');
const { CreateUser, handleLogin } = require('../controllers/userController');

const routerAPI = express.Router();

routerAPI.get('/', (req, res) => {
    return res.status(200).json({ message: 'Hello World API' });
});

routerAPI.post('/register', CreateUser);

routerAPI.post('/login', handleLogin);

module.exports = routerAPI; //export default