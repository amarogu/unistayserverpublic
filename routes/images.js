const express = require('express');
const User = require('../models/User');
const Image = require('../models/Image');
const Publication = require('../models/Publication');
const { upload, checkOwnership, isAuthenticated } = require('../middleware');
const router = express.Router();
const path = require('path');



router.put('/user/images', isAuthenticated, upload, async (req, res) => {
    try {
        const image = new Image({
            referenceId: req.user._id,
            onModel: 'User',
            path: req.files[0].path,
            position: 1,
            cover: false,
        });
        await image.save();
        // Update the user's profilePicture field with the new image ID.
        const user = await User.findById(req.user._id);
        user.profilePicture = image._id;
        await user.save();
        console.log(req.user._id);
        res.send({ message: 'Image uploaded and user updated successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.put('/user/publication/:title/images', isAuthenticated, checkOwnership, upload, async (req, res) => {
    try {
        const publication = await Publication.findOne({title: req.params.title});
        const image = new Image({
            referenceId: publication._id,
            path: req.file.path,
            onModel: 'Publication',
            // Add other fields here.
            position: 1,
            cover: false,
        });
        await image.save();
        publication.images.push(image._id);
        await publication.save();
        res.send({ message: 'Image uploaded and publication updated successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/user/profilepicture', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const image = await Image.findById(user.profilePicture);
        let imagePath = path.resolve(__dirname, '..', image.path);
        res.sendFile(imagePath);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/getuserpicture/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.query.id);
        if (user.private) {
            return res.status(400).send({ error: 'User has a private profile' });
        }
        const image = await Image.findById(user.profilePicture);
        let imagePath = path.resolve(__dirname, '..', image.path);
        res.sendFile(imagePath);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/image/:id', isAuthenticated, async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        let imagePath = path.resolve(__dirname, '..', image.path);
        res.sendFile(imagePath);
    } catch (error) {
        console.log(error)
        res.status(400).send({ error: error.message });
    }
});

module.exports = router;