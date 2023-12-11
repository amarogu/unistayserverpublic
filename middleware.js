const multer = require('multer');
const Publication = require('./models/Publication');

const checkOwnership = async (req, res, next) => {
    const publication = await Publication.findOne({title: req.params.title});
    if (req.user.accountType === 'publisher') {
        if (req.user.owns.includes(publication._id)) {
            return next();
        } else {
            res.status(401).send({ message: 'You are not the owner of this publication' });
        }
    } else {
        res.status(401).send({ message: 'You are not a publisher' });
    }
}

const checkUserId = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.id.toString() === req.params.id) {
            return next();
        } else {
            res.status(401).send({ message: 'You cant access data of another user.' });
        }
    } else {
        res.status(401).send({message: "Unauthorized: please login first"});
    }
};

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.status(401).send({ message: 'You are not authorized to access this resource' });
    }
};
 
const Storage = multer.diskStorage({
    destination: 'images',
    filename: function(req, file, callback) {
        callback(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
    }
});

const upload = multer({
    storage: Storage,
    limits: {
        fieldSize: 1024 * 1024 * 25
    }
}).array('images', 10)

module.exports = {
    checkUserId,
    isAuthenticated,
    checkOwnership,
    upload
}