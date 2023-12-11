const { Server } = require('socket.io');
const { createServer } = require('http');

const app = require('./index'); // assuming 'app' exports an Express app
const server = createServer(app);

const io = new Server(server);

io.on('connection', async (socket) => {
    console.log(`User ${socket.handshake.session.passport.user.username} is connected`)
});

server.listen(process.env.SOCKET, () => {
    console.log(`Socket is running on port ${process.env.SOCKET}`);
});
 
module.exports = io;
