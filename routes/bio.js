const express = require('express');
const User = require('../models/User');
const { checkUserId } = require('../middleware');
const router = express.Router();

router.put('/user/:id/bio', checkUserId, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.bio = req.body.bio;
        await user.save();
        res.send({ message: 'Bio updated successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

module.exports = router;