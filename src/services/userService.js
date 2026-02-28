const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRound = 10
const createUserService = async (name, email, password) => {

    try {
//check email exist
        const user = await User.findOne({ email });
        if (user) {
            console.log(">>> Email is exist: ", email);
            return null;
        }
            
    // hass password
    const hashpassword = await bcrypt.hash(password, saltRound);
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

            if (!isMatchPassword) {
                return {
                    EC: 2,
                    EM: "Password is not match"
                }
            } else {
                const payload = { email: user.email, name: user.name }
                const access_token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN })
                return {
                    user:{email1: user.email, name: user.name},
                    access_token,
                    EC: 0,
                }
            }

        } else {
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

const getUserService = async () => {

    try {
        let result = await User.find({})
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}




module.exports = {
    createUserService,
    loginService,
    getUserService
}