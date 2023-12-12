const express = require('express');
const route1Controller = require('../controllers/route1Controller');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/get_route1', protect, route1Controller.getRoute1);

module.exports = router;