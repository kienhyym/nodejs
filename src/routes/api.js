const express = require('express');
const { route } = require('express/lib/application');
const router = require('express/lib/router');
const { CreateUser, handleLogin, getUser, getAccount } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { createLecture, getLectures, getLectureDetail,updateLecture ,deleteLecture} = require("../controllers/lectureController");
const upload = require("../middleware/upload");

const routerAPI = express.Router();

// routerAPI.all('*', auth)
routerAPI.get('/',  (req, res) => {
    return res.status(200).json({ message: 'Hello World API' });
})

routerAPI.post('/register', CreateUser);

routerAPI.post('/login', handleLogin);
routerAPI.get('/user', getUser);
routerAPI.get('/account',auth, getAccount);

routerAPI.post(
  "/lecture",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 10 }
  ]),
  createLecture
);

routerAPI.get("/lectures", getLectures);

routerAPI.put(
  "/lecture/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 10 }
  ]),
  updateLecture
);

routerAPI.get("/lecture/:id", getLectureDetail);
routerAPI.delete("/lecture/:id", deleteLecture);
module.exports = routerAPI; //export default