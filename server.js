const http = require('http');
const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.RIDE_PORT || 3003;
const server = http.createServer(app);


server.listen(port, () => {
    console.log(`Ride Server is running on port ${port}`);
});