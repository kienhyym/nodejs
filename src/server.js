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

app.use(cors({
  origin: 'https://admin-hoc8.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://admin-hoc8.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
app.options('*', cors()); // 👈 bắt buộc

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
