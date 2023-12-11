const express = require('express');
const User = require('../models/User');
const router = express.Router();
const Image = require('../models/Image');
const {checkUserId, isAuthenticated, upload} = require('../middleware');

router.get ('/user', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.send(user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.put('/user/profilepicture', isAuthenticated, upload, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const newImage = new Image({
            referenceId: user._id,
            onModel: 'User',
            path: req.files[0].path,
            position: 1,
            cover: false,
        });
        await newImage.save();
        user.profilePicture = newImage._id;
        await user.save();
        console.log(user)
        res.send({ message: user._id });
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: error });
    }
});

router.put('/user/:property', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).send({error: 'User not found'});
        }
        if(req.params.property === 'accountType') {
            return res.status(400).send({error: 'Cannot change account type'});
        }
        if(req.params.property === 'email') {
            return res.status(400).send({error: 'Cannot change email'});
        }
        if (req.params.property === 'password') {
            if (await user.isCorrectPassword(req.body.currentPassword)) {
                user.password = req.body.newPassword;
            } else {
                return res.status(400).send({error: 'Incorrect current password'});
            }
            await user.save();
            return res.send({message: 'Password changed successfully'});
        }
        user[req.params.property] = req.body[req.params.property];
        await user.save();
        res.send({message: `User ${req.params.property} updated successfully`});
    } catch (error) {
        console.log(error)
        res.status(400).send({error: error.code});
    }
});

router.get('/userprofile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.query.id);
        res.send(
            {
                _id: user._id,
                bio: user.bio,
                profilePicture: user.profilePicture,
                name: user.name,
                surname: user.surname,
                accountType: user.accountType,
                username: user.username,
                connectedPublications: user.connectedPublications,
                backgroundImage: user.backgroundImage
            }
        );
    } catch (error) {
        console.log(error)
    }
});

router.post('/user/validate/username', async (req, res) => {
    try {
        const user = await User.find({username: req.query.username});
        if (user.length > 0) {
            return res.send({message: "unavailable"});
        } else {
            return res.send({message: "available"});
        }
    } catch (error) {
        res.status(400).send({error: error.message});
    }
});

router.post('/user/validate/email', async (req, res) => {
    try {
        const user = await User.find({email: req.query.email});
        if (user.length > 0) {
            return res.send({message: "unavailable"});
        } else {
            return res.send({message: "available"});
        }
    } catch (error) {
        res.status(400).send({error: error.message});
    }
});

module.exports = router;