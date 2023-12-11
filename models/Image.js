const mongoose = require('mongoose');
const uuidv4 = require('uuid').v4;

const imageSchema = new mongoose.Schema({
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    onModel: {
        type: String,
        required: false,
        enum: ['User', 'AccProvider', 'Publication', 'Message']
    },
    path: String,
    position: Number,
    cover: Boolean,
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;