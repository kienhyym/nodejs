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

const loginService = async (email1, password) => {
    try {
        const user = await User.findOne({ email: email1 });
        if (user) {
            const isMatchPassword = await bcrypt.compare(password, user.password)

            if(!isMatchPassword) {
                return {
                    EC: 2,
                    EM: "Password is not match"
                }
            }else {
                return "Login success"
            }

        }else {
            return {
                EC: 1,
                EM: "User not found"
            }
        }

    } catch (error) {
        console.log(error);
        return null;
    }
}






module.exports = {
    createUserService,
    loginService
}