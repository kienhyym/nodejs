const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const getLectureService = async () => {

    try {
        let result = await User.find({})
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}




module.exports = {
    getLectureService
}