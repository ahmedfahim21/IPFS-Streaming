const Model = require('../models/Model1.Model');

// @desc    Get route1
// @route   GET /route1/get_route1
// @access  Private
const getRoute1 = async (req, res) => {
    try {
        const route1 = await Model.find();
        res.json(route1);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getRoute1
}
