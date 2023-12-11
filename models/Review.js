const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    publicationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Publication'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: false,
        maxlength: 500
    }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;