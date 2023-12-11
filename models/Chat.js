const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    publicationAssociated: {
        type: Boolean,
        required: true,
    },
    publicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publication',
        required: function() {
            return this.publicationAssociated;
        }
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        // defaults to createdAt
        default: function() {
            return this.createdAt;
        }
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: false
    }],
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;