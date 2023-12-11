const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {isAuthenticated} = require('../middleware');
const Review = require('../models/Review');
const Publication = require('../models/Publication');

router.post('/review', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const publication = await Publication.findById(req.query.id);

        const existingReview = await Review.findOne({ userId: user._id, publicationId: publication._id });
        if (existingReview) {
            return res.status(400).send({ message: 'User has already reviewed this place' });
        }

        const review = new Review({
            userId: user._id,
            publicationId: publication._id,
            ...req.body
        });
        await review.save();
        publication.reviews.push(review._id);
        publication.rating = (publication.rating * (publication.reviews.length - 1) + review.rating) / publication.reviews.length;
        user.reviews.push(review._id);
        await user.save();
        await publication.save();
        res.send({message: 'Review created successfully'});
    } catch (error) {
        res.status(400).send({message: error.message});
        console.log(error)
    }
});

router.get('/review', isAuthenticated, async (req, res) => {
    try {
        const review = await Review.findById(req.query.id);
        const reviewer = await User.findById(review.userId);
        res.send({...review._doc, reviewer: reviewer.username});
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

module.exports = router;