const express = require('express');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware');
const router = express.Router();
const Publication = require('../models/Publication');
const geolib = require('geolib');

router.get('/nearest-to', isAuthenticated, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const publications = await Publication.find({});
        let nearestPublications;

        let pubLocs = publications.map(publication => ({
            latitude: publication.location.latitude,
            longitude: publication.location.longitude,
            publication: publication
        }));

        let orderedLocations = geolib.orderByDistance(
            {latitude: lat, longitude: lng},
            pubLocs
        );

        let orderedPublications = orderedLocations
            .filter(loc => geolib.getPreciseDistance(
                {latitude: lat, longitude: lng},
                {latitude: loc.latitude, longitude: loc.longitude}
            ) <= 200000) // distance in meters
            .map(loc => loc.publication);

        nearestPublications = [...orderedPublications];

        res.send(nearestPublications);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/nearest', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const publications = await Publication.find({});
        let nearestPublications;

        await Promise.all(user.preferredLocations.map(async location => {
            let pubLocs = publications.map(publication => ({
                latitude: publication.location.latitude,
                longitude: publication.location.longitude,
                publication: publication
            }));

            let orderedLocations = geolib.orderByDistance(
                {latitude: location.latitude, longitude: location.longitude},
                pubLocs
            );

            let orderedPublications = orderedLocations
                .filter(loc => geolib.getPreciseDistance(
                    {latitude: location.latitude, longitude: location.longitude},
                    {latitude: loc.latitude, longitude: loc.longitude}
                ) <= 200000) // distance in meters
                .map(loc => loc.publication);

            nearestPublications = [...orderedPublications];
        }));

        res.send(nearestPublications);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});







module.exports = router;