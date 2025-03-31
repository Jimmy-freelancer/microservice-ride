const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports.authUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const response = await axios.get(`${process.env.BASE_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const user = response.data;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.authCaptain = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const url = `${process.env.BASE_URL}/captains/profile`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const captain = response.data;

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;

        next();

    } catch (error) {
        console.log(`Error fetching captain profile: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};