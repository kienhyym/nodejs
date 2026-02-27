const User = require("../models/user");
const bcrypt = require('bcrypt');

const saltRound = 10
const createUserService = async (name, email, password) => {
    // hass password
    const hashpassword = await bcrypt.hash(password, saltRound);
    try {
        let result = await User.create({
            name: name,
            email: email,
            password: hashpassword,
            role: "user"
        })
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}





module.exports = {
    createUserService
}