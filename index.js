const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs')
const https = require('https');
const http = require('http');

const privateKey = fs.readFileSync('./sslcertificate/certificate.key', 'utf8');
const certificate = fs.readFileSync('./sslcertificate/certificate.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const app = express();

const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

httpsServer.listen(process.env.HTTPS_PORT, () => {
    console.log(`HTTPS Server running on port ${process.env.HTTPS_PORT}`);
});

httpServer.listen(process.env.HTTP_PORT, () => {
    console.log(`HTTP Server running on port ${process.env.HTTP_PORT}`);
});

const io = require('./socket');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session')

const passport = require('passport');

const authRoutes = require('./routes/auth');
const bioRoutes = require('./routes/bio');
const imageRoutes = require('./routes/images');
const locationRoutes = require('./routes/location');
const chatRoutes = require('./routes/chat');
const publicationRoutes = require('./routes/publication');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/review');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
const sessionInstance = session({secret: process.env.SECRET})
app.use(sessionInstance);
const sharedsession = require("express-socket.io-session");

// io middlewares
io.use(sharedsession(sessionInstance, {autoSave: true}));
io.use((socket, next) => {
    if (socket.handshake.session.passport) {
        console.log('Authenticated user with id:', socket.handshake.session.passport.user);
        next();
    } else {
        console.log('Unauthenticated user');
        next(new Error('Unauthenticated user'));
    }
})


const dbUrl = process.env.MONGO_URI;
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'))

// Routes
app.use('/', authRoutes);
app.use('/', bioRoutes);
app.use('/', imageRoutes);
app.use('/', locationRoutes);
app.use('/', chatRoutes);
app.use('/', publicationRoutes);
app.use('/', userRoutes);
app.use('/', reviewRoutes);

module.exports = app;