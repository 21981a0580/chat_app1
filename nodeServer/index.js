const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('new-user-joined', (name) => {
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
    });

    socket.on('send', (data) => {
        socket.broadcast.emit('receive', { 
            message: data.message, 
            name: users[socket.id], 
            timestamp: data.timestamp, 
            id: data.id 
        });
    });

    socket.on('file', (data) => {
        socket.broadcast.emit('file', { 
            name: users[socket.id], 
            fileUrl: data.fileData,
            fileName: data.fileName 
        });
    });

    socket.on('disconnect', () => {
        const name = users[socket.id];
        if (name) {
            socket.broadcast.emit('left', name);
            delete users[socket.id];
        }
    });
});

server.listen(9000, () => {
    console.log('Server is running on port 9000');
});
