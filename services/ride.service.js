
const rideModel = require('../models/ride.model');
const axios = require('axios');
const crypto = require('crypto');


async function getFare(pickup, destination) {

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }
    try {
        const distanceTime = await axios.get(`${process.env.BASE_URL}/maps/get-distance-time?origin=${pickup}&destination=${destination}`);

        if (!distanceTime || !distanceTime.data || !distanceTime.data.distance || !distanceTime.data.duration) {
            throw new Error('Invalid response from distance-time API');
        }

        const baseFare = {
            auto: 30,
            car: 50,
            moto: 20
        };

        const perKmRate = {
            auto: 10,
            car: 15,
            moto: 8
        };

        const perMinuteRate = {
            auto: 2,
            car: 3,
            moto: 1.5
        };

        const fare = {
            auto: Math.round(baseFare.auto + ((distanceTime.data.distance.value / 1000) * perKmRate.auto) + ((distanceTime.data.duration.value / 60) * perMinuteRate.auto)),
            car: Math.round(baseFare.car + ((distanceTime.data.distance.value / 1000) * perKmRate.car) + ((distanceTime.data.duration.value / 60) * perMinuteRate.car)),
            moto: Math.round(baseFare.moto + ((distanceTime.data.distance.value / 1000) * perKmRate.moto) + ((distanceTime.data.duration.value / 60) * perMinuteRate.moto))
        };

        return { fare, distanceTime: distanceTime.data };

    } catch (error) {
        console.error('Error fetching distance and time:', error.message);
        throw new Error('Can not fetch distance and time');
    }
}

module.exports.getFare = getFare;


module.exports.createRide = async ({ user, pickup, destination, vehicleType, selected_fare }) => {
    if (!user || !pickup || !destination || !vehicleType || !selected_fare) {
        throw new Error('All fields are required');
    }

    try {
        const infoResponse = await axios.get(`${process.env.BASE_URL}/maps/traffic?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`);
        const info = infoResponse.data;

        const extractNumbers = (str) => {
            return parseFloat(str.replace(/[^\d.]/g, ""));
        };
        
        
        const parseDuration = (durationStr) => {
            const hoursMatch = durationStr.match(/(\d+)\s*hour/);
            const minutesMatch = durationStr.match(/(\d+)\s*min/);
            
            const hours = hoursMatch ? parseInt(hoursMatch[1]) * 60 : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        
            return hours + minutes;
        };
        
        const ride = await rideModel.create({
            user,
            pickup,
            destination,
            otp: getOtp(6),
            fare: parseInt(selected_fare),
            vehicleType: vehicleType,
            duration: parseDuration(info.duration_in_traffic), // Convert to minutes
            distance: extractNumbers(info.distance) // Convert "323 km" to 323
        });
        
    
        return ride;

    } catch (error) {
        console.error("Error creating ride:", error);
        throw new Error("Failed to fetch ride details.");
    }
};


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

module.exports.changeRideStatus = async (rideId, status, captainId) => {
    if (!rideId || !status || !captainId) {
        throw new Error('Ride id and status are required');
    }

    const ride = await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status,
        captain: captainId
    }, { new: true }).select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }   

    return ride;
}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    // if (ride.status !== 'accepted') {
    //     throw new Error('Ride not accepted');
    // }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing',
        captain: captain._id
    })

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }
    
    const captainId = captain.captain._id;
    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captainId
    });
   

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}

module.exports.getOngoingRidesForUser = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const ridesData = await rideModel.find({
        user: userId,
        status: 'ongoing'
    });

    const rides = await Promise.all(ridesData.map(async (ride) => {
        const captainResponse = await axios.get(`${process.env.BASE_URL}/captains/get-CaptainById?id=${ride.captain}`);
        const captain = captainResponse.data;
        return {
            ...ride.toObject(),
            captain
        };
    }));

    return rides;
}

module.exports.getOngoingRidesForCaptain = async (captain) => {
    if (!captain) {
        throw new Error('Captain is required');
    }
    const captainId = captain.captain._id;
    const ridesData = await rideModel.find({
        captain: captainId,
        status: 'ongoing'
    });

    const rides = await Promise.all(ridesData.map(async (ride) => {
        const userResponse = await axios.get(`${process.env.BASE_URL}/users/user?userId=${ride.user}`);
        const user = userResponse.data;
        return {
            ...ride.toObject(),
            user
        };
    }));

    return rides;
}