const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const cookieParser = require('cookie-parser');  
const connectDB = require('../ride/db/db');
const RabbitMQ = require('../ride/services/rabbitmq');
const rideRoutes = require('../ride/routes/ride.route')
const cors = require('cors');
app.use(cors());    

connectDB();
RabbitMQ.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/test', (req, res) => {
    res.send('Ride Service is running!');
});

app.use('/', rideRoutes);


module.exports = app;