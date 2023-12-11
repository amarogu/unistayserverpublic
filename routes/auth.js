const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const Image = require('../models/Image');
const Publication = require('../models/Publication');
const LocalStrategy = require('passport-local');
const { upload } = require('../middleware')
require('dotenv').config();
const OpenAi = require('openai').OpenAI;
const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const router = express.Router();

const axios = require('axios');
const fs = require('fs');


passport.use(new LocalStrategy({
    usernameField: 'email',
}, async function(username, password, done) {
    console.log("djjddnd")
    try {
        const user = await User.findOne({ email: username });
        if (!user) {
            return done(null, false); // User not found
        }
        const isPasswordCorrect = await user.isCorrectPassword(password);
        if (!isPasswordCorrect) {
            return done(null, false); // Incorrect password
        }
        return done(null, user); // Authentication successful
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
  
passport.deserializeUser(async (id, done) => {
  try {
      const user = await User.findById(id);
      done(null, user);
  } catch (error) {
      done(error);
  }
});

router.post('/register', upload, async (req, res) => {
    try {
        const userData = JSON.parse(req.body.userData);
        const user = new User(userData);

        const generated = await openai.images.generate({
            model: "dall-e-3",
            prompt: "A city from a view above",
            n: 1,
            size: "1024x1024",
        });
        let image_url = generated.data[0].url;

        const response = await axios({
            method: 'GET',
            url: image_url,
            responseType: 'stream'
        });  

        const pathToImage = `images/${Date.now()}_backgroundImage.png`;
        const writer = fs.createWriteStream(pathToImage);
        response.data.pipe(writer);
        
        writer.on('finish', async () => {
            // Create new Image instance and save it to database
            const backgroundImage = new Image({
                referenceId: user._id,
                onModel: 'User',
                path: pathToImage,
                position: 1,
                cover: false,
            });
            await backgroundImage.save();
            user.backgroundImage = backgroundImage._id;
            await user.save();
            res.status(201).send({ message: 'User created' });
        });
        
        writer.on('error', (err) => {
            // Handle error
            console.error(err);
            res.status(500).send({ message: 'Error saving image' });
        });

        if (userData.accountType === 'provider') {
            const pubData = JSON.parse(req.body.publicationData);
            const publication = new Publication({
                owner: user._id,
                ...pubData
            });
            const imagePromises = req.files.slice(1).map(async (file, index) => {
                const image = new Image({
                    referenceId: publication._id,
                    onModel: 'Publication',
                    path: file.path,
                    position: index + 1,
                    cover: false,
                });
                await image.save();
                publication.images.push(image._id);
            });

            const profilePicture = new Image({
                referenceId: user._id,
                onModel: 'User',
                path: req.files[0].path,
                position: 1,
                cover: false,
            });       

            await Promise.all([...imagePromises, profilePicture.save()]);
            user.profilePicture = profilePicture._id;
            await publication.save();
            user.owns.push(publication._id);
        } else {
            const image = new Image({
                referenceId: user._id,
                onModel: 'User',
                path: req.files[0].path,
                position: 1,
                cover: false,
            });
            await image.save();
            user.profilePicture = image._id;
        }
        await user.save();
        res.status(201).send({ message: 'User created' });
    } catch (error) {
        console.log(error)
        res.status(400).send(error);
    }
});


router.post('/login', passport.authenticate('local'), (req, res) => {
    res.send({ message: 'Logged in successfully' });
});

router.get('/logout', (req, res) => {
    req.logout();
    res.send({ message: 'Logged out successfully' });
});

module.exports = router;