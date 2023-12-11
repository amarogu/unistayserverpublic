const express = require('express');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { isAuthenticated } = require('../middleware');
const router = express.Router();

const io = require('../socket');

const userSockets = {};

// When a user connects, store their socket in userSockets
io.on('connection', (socket) => {
    const userId = socket.handshake.session.passport.user;
    userSockets[userId] = socket;
});

router.put('/chat/drop', isAuthenticated, async (req, res) => {
    try {
        const chat = await Chat.findById(req.query.id);
        if (!chat) {
            return res.status(400).send({ error: 'Chat could not be found' });
        }
        const user = await User.findById(req.user._id);
        if (chat.creator.toString() !== user._id.toString()) {
            return res.status(400).send({ error: 'User is not the creator of this chat' });
        }
        await chat.deleteOne();
        res.send({ message: 'Chat deleted successfully' });
    } catch(error) {
        res.status(400).send({ message: error.message });
    }
});

router.put('/chat/leave', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const chat = await Chat.findById(req.query.id);
        if (!chat) {
            return res.status(400).send({ error: 'Chat could not be found' });
        }
        if (!chat.participants.includes(user._id)) {
            return res.status(400).send({ error: 'User is not a participant of this chat' });
        }
        if (chat.creator.toString() === user._id.toString()) {
            return res.status(400).send({ error: 'User is the creator of this chat' });
        }
        chat.participants = chat.participants.filter((participant) => participant.toString() !== user._id.toString());
        await chat.save();
        res.send({ message: 'User removed from chat successfully' });
    } catch(error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/chat', isAuthenticated, async (req, res) => {
    try {
        console.log("tried")
        const user = await User.findById(req.user._id);
        const chat = new Chat({
            creator: user._id,
            publicationAssociated: req.body.publicationAssociated,
            participants: [user._id],
            publicationId: req.body.publicationAssociated ? req.body.publicationId : undefined
        });
        await chat.save();
        console.log(chat)
        res.send({ message: "Chat created successfully", chatId: chat._id });
    } catch (error) {
        res.status(400).send({ error: error.message });
        console.log(error)
    }
});

router.put('/chat/:chatId/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const newUser = await User.findOne({ username: req.query.name });
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(400).send({ error: 'Chat could not be found' });
        }
        if (chat.creator.toString() !== user._id.toString()) {
            return res.status(400).send({ error: 'User is not the creator of this chat' });
        }
        if (chat.participants.includes(newUser._id)) {
            return res.status(400).send({ error: 'User is already a participant of this chat' });
        }
        chat.participants.push(newUser._id);
        await chat.save();
        res.send({ message: 'User added to chat successfully' });
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: error.message });
    }
});

router.post('/message', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const chat = await Chat.findById(req.body.chatId);
        if (!chat.participants.includes(user._id)) {
            return res.status(400).send({ error: 'User is not a participant of this chat' });
        }
        chat.populate('participants', 'username');
        const message = new Message({
            senderId: user._id,
            chatId: chat._id,
            content: req.body.content,
            createdAt: Date.now()
        });
        chat.messages.push(message._id);
        await message.save();
        await chat.populate('messages'); 
        await chat.save();
        
        io.to(chat._id.toString()).emit('message', message);
        res.send(chat);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/chats', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const chats = await Chat.find({ participants: user._id }).populate('participants', 'username').populate('messages');
        //console.log(chats)
        console.log(userSockets)
        const userSocket = userSockets[req.user._id];
        console.log(userSocket)
        if (userSocket) {
            chats.forEach((chat) => {
                userSocket.join(chat._id.toString());
                console.log(`User ${user.username} joined chat ${chat._id}`);
            });
        }
        res.send(chats);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

module.exports = router;