const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');

const rideController = require('../controllers/ride.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/create',
    authMiddleware.authUser,
    body('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    body('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    body('vehicleType').isString().isIn(['auto', 'car', 'moto']).withMessage('Invalid vehicle type'),
    body('selected_fare').isNumeric().withMessage('Invalid fare amount'), 
    rideController.createRide
);

router.get('/get-fare',
    query('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    query('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    rideController.getFare
)

router.put('/change-status',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride ID'),
    body('status').isString().isIn([ 'accepted', 'completed', 'cancelled' ]).withMessage('Invalid status'),
    body('captainId').isMongoId().withMessage('Invalid captain ID'),
    rideController.changeRideStatus
)

router.get('/start-ride',
    authMiddleware.authCaptain,
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    query('otp').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
    rideController.startRide
)

router.post('/end-ride',
    authMiddleware.authCaptain,
    body('ride').isObject().notEmpty().withMessage('Invalid ride object'),
    rideController.endRide
)

router.get('/get-user-rides',
    authMiddleware.authUser,
    rideController.getOngoingRidesForUser
)

router.get('/get-captain-rides',
    authMiddleware.authCaptain,
    rideController.getOngoingRidesForCaptain
)


module.exports = router;