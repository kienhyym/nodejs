require('dotenv').config();
const express = require('express'); //commonjs
const configViewEngine = require('./config/viewEngine');
const apiRoutes = require('./routes/api');
const connection = require('./config/database');
const { getHomepage } = require('./controllers/homeController');
const cors = require('cors');
// const delay = require('./middleware/delay');
const app = express();
const port = process.env.PORT || 8888;

//config corssd
app.use(cors());
app.options('*', cors());

// app.use(delay);

//config req.body
app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data

//config template engine
configViewEngine(app);

const webApi = express.Router();
webApi.get("/",getHomepage)

app.use('/', webApi);

//khai báo route
app.use('/v1/api/', apiRoutes);


(async () => {
    try {
        //using mongoose
        await connection();

        app.listen(port, () => {
            console.log(`Backend Nodejs App listening on port ${port}`)
        })
    } catch (error) {
        console.log(">>> Error connect to DB: ", error)
    }
})()
