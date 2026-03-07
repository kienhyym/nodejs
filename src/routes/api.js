const express = require('express');
const { route } = require('express/lib/application');
const router = require('express/lib/router');
const { CreateUser, handleLogin, getUser, getAccount } = require('../controllers/userController');
const auth = require('../middleware/auth');

const routerAPI = express.Router();

// routerAPI.all('*', auth)
routerAPI.get('/',  (req, res) => {
    return res.status(200).json({ message: 'Hello World API' });
})

routerAPI.post('/register', CreateUser);

routerAPI.post('/login',auth, handleLogin);
routerAPI.get('/user', getUser);
routerAPI.get('/account',auth, getAccount);


module.exports = routerAPI; //export default