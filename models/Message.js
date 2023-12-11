const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Chat'
    },
    content: String,
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        // defaults to createdAt
        default: function() {
            return this.createdAt;
        }
    },
    deletedAt: {
        type: Date,
        required: false
    }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;