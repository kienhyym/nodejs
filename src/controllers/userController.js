const { createUserService } = require("../services/userService");

const CreateUser = async (req, res) => {
    console.log(">>> Check req.body: ", req.body);
    const { name, email, password } = req.body;
    const data = await createUserService(name, email, password);
    return res.status(200).json(data);
}

module.exports = {
    CreateUser
}