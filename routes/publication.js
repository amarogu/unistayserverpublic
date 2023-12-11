const express = require('express');
const User = require('../models/User');
const Publication = require('../models/Publication');
const Image = require('../models/Image');
const { isAuthenticated, upload } = require('../middleware');
const router = express.Router();

const io = require('../socket');
io.on('connection', async (socket) => {
    const userId = socket.handshake.session.passport.user;
    socket.join(userId);
});

router.get('/publication/connectedusers/', isAuthenticated, async (req, res) => {
    try {
        const publication = await Publication.findById(req.query.id);
        if (!publication) {
            return res.status(400).send({ error: 'Publication not found' });
        }
        const connectedUsers = await User.find({ _id: { $in: publication.connectedUsers } });
        let userData = []
        connectedUsers.forEach(user => {
            userData.push({
                _id: user._id,
                username: user.username
            })
        });
        res.send(userData);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/createpublication', isAuthenticated, upload, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const accountType = user.accountType;
        if (accountType !== 'provider') {
            return res.status(400).send({ error: 'User is not a provider' });
        }
        const pubData = JSON.parse(req.body.publication);
        const publication = new Publication({
            owner: user._id,
             ...pubData
        });

        const imagePromises = req.files.map(async (file, index) => {
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

        await Promise.all(imagePromises);
        res.send({message: "Accommodation created successfully"});
        await publication.save();
        
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});


router.put('/user/publication', isAuthenticated, async (req, res) => {
    try {
        const newUser = await User.findById(req.user._id);
        if (!newUser) {
            return res.status(400).send({ message: 'Could not add user: User could not be found' });
        }
        const publication = await Publication.findById(req.query.id);
        if (!publication) {
            return res.status(400).send({ message: 'Could not add user: Publication could not be found' });
        }
        if (publication.owner.toString() === req.user._id.toString()) {
            return res.status(400).send({ message: 'Could not add user: You are the owner of this publication, therefore you cannot add any users' });
        }
        if (publication.connectedUsers.map(id => id.toString()).includes(newUser._id.toString())) {
            return res.status(400).send({ message: 'Could not add user: User is already connected to this publication' });
        }
        publication.connectedUsers.push(newUser._id);
        newUser.connectedPublications.push(publication._id);
        await newUser.save();
        await publication.save();
        io.to(publication.owner.toString()).emit('newConn', {newUser, publication});
        res.send({ message: 'User added to publication successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.put('/user/publication/disconnect', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).send({ message: 'Could not disconnect user: User could not be found' });
        }
        const publication = await Publication.findById(req.query.id);
        if (!publication) {
            return res.status(400).send({ message: 'Could not disconnect user: Publication could not be found' });
        }
        if (publication.owner.toString() === req.user._id.toString()) {
            return res.status(400).send({ message: 'Could not disconnect user: You are the owner of this publication, therefore you cannot disconnect any users' });
        }
        if (!publication.connectedUsers.map(id => id.toString()).includes(user._id.toString())) {
            return res.status(400).send({ message: 'Could not disconnect user: User is not connected to this publication' });
        }
        publication.connectedUsers.pull(user._id);
        user.connectedPublications.pull(publication._id);
        publication.requests.pull(user._id);
        await user.save();
        await publication.save();
        io.to(publication.owner.toString()).emit('userDisconnected', {user, publication});
        res.send({ message: 'User disconnected from publication successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.put('/user/publication/:publicationId/:property', isAuthenticated, async (req, res) => {
    try {
        const publication = await Publication.findById(req.params.publicationId);
        if (!publication) {
            return res.status(400).send({ error: `Could not change the ${req.params.property}: Publication not found` });
        }
        if (publication.owner.toString() !== req.user._id.toString()) {
            return res.status(400).send({ error: `You cannot change the ${req.params.property} of a publication you do not own.` });
        }
        publication[req.params.property] = req.body[req.params.property];
        await publication.save();
        res.send({ message: `Publication ${req.params.property} updated successfully` });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});


router.get('/publication', isAuthenticated, async (req, res) => {
    try {
        const publications = await Publication.find().limit(20);
        console.log(req.user._id)
        if (!publications) {
            return res.status(400).send({ error: 'Publication not found' });
        }
        
        res.send(publications);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/yourpublications', isAuthenticated, async (req, res) => {
    try {
        const publications = await Publication.find({owner: req.user._id});
        if (!publications) {
            return res.status(400).send({ error: 'Publication not found' });
        }
        res.send(publications);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
})

router.put('/publication/connected/', isAuthenticated, async (req, res) => {

})

router.put('/publication/save/', isAuthenticated, async (req, res) => {
    try {
        const publication = await Publication.findById(req.query.id);
        const add = req.query.add === 'true';
        const user = await User.findById(req.user._id);
        if (!publication) {
            return res.status(400).send({ message: 'Publication not found' });
        }
        if (add) {
            user.savedPublications.push(publication._id);
        } else {
            user.savedPublications = user.savedPublications.filter(id => id.toString() !== publication._id.toString());
            console.log(user.savedPublications)
            console.log("Test hello 12")
            await user.save();
            return res.send({ message: 'Publication removed from favorites successfully' })
        }
        await user.save();
        console.log(user.savedPublications)
        res.send({ message: 'Publication added to favorites successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
})

router.put('/publication/request', isAuthenticated, async (req, res) => {
    try {
        const publication = await Publication.findById(req.query.id);
        const user = await User.findById(req.user._id);
        if (!publication) {
            return res.status(400).send({ message: 'Publication not found' });
        }
        if (publication.owner.toString() === user._id.toString()) {
            return res.status(400).send({ message: 'You cannot request a publication you own' });
        }
        if (publication.requests.map(id => id.toString()).includes(user._id.toString())) {
            return res.status(400).send({ message: 'You have already requested this publication' });
        }
        publication.requests.push(user._id);
        await publication.save();
        io.to(publication.owner.toString()).emit('newRequest', {user, publication});
        res.send({ message: 'Request sent successfully' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.put('/publication/acceptrequest', isAuthenticated, async (req, res) => {
    try {
        const publication = await Publication.findById(req.query.id);
        const user = await User.findById(req.user._id);
        if (!publication) {
            return res.status(400).send({ message: 'Publication not found' });
        }
        if (publication.owner.toString() !== user._id.toString()) {
            return res.status(400).send({ message: 'You cannot accept a request for a publication you do not own' });
        }
        if (!publication.requests.map(id => id.toString()).includes(req.query.userId.toString())) {
            return res.status(400).send({ message: 'User has not requested this publication' });
        }
        publication.requests.pull(req.query.userId);
        publication.acceptedRequests.push(req.query.userId);
        await publication.save();
        res.send({ message: 'Request accepted successfully' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.put('/publication/revokerequest', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const publication = await Publication.findById(req.query.id);
        if (!publication) {
            return res.status(400).send({ message: 'Publication not found' });
        }
        if (!publication.requests.map(id => id.toString()).includes(req.user._id.toString())) {
            return res.status(400).send({ message: 'User has not requested this publication' });
        }
        publication.requests.pull(user._id);
        await publication.save();
        res.send({ message: 'Request revoked successfully' });
    } catch(error) {
        console.log(error)
        res.status(400).send({ message: error.message });
    }
})

module.exports = router;