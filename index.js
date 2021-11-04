require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mainRouter = require("./routes/index");
const { PORT } = require("./constants/constants");
const { MONGO_URI } = require("./constants/constants");
const bodyParser = require('body-parser');
const app = express();
const app2 = express();
const http = require('http');
const chatServer = http.createServer(app2);
const { Server } = require("socket.io");
const io = new Server(chatServer);
const jwt = require("jsonwebtoken");
const chatController = require("./controllers/Chats");
// const MessageModel = require("../models/Messages");

// connect to mongodb
mongoose.connect(MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
    .then(res => {
        console.log("connected to mongodb");
    })
    .catch(err => {
        console.log(err);
    })

// use middleware to parse body req to json


// use middleware to enable cors
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
// route middleware
app.use("/", mainRouter);

app.get('/settings', function (req, res) {
    res.send('Settings Page');
});


app.listen(PORT, () => {
    console.log("server start - " + PORT);
})

var socketIds = {};
var mapSocketIds = {};

// Socket.io chat realtime
io.on('connection', (socket) => {
    // MessageModel.find().then(result => {
    //     socket.emit('output-messages', result)
    // })
    // console.log('a user connected: ', socket.handshake.headers);
    // console.log(socket.id);
    if (socket.handshake.headers.token) {
        try {
            decoded = jwt.verify(socket.handshake.headers.token, process.env.JWT_SECRET);
            if (socketIds[decoded.id]) {
                socketIds[decoded.id].push(socket.id);
            } else {
                socketIds[decoded.id] = [socket.id];
            }
            mapSocketIds[socket.id] = decoded.id;
        } catch (e) {
            console.log("Invalid token")
        }
    }
    socket.emit('message', 'Hello world');
    socket.on('disconnect', () => {
        // console.log('user disconnected: ' + socket.id);
        let userId = mapSocketIds[socket.id];
        var index = socketIds[userId].indexOf(socket.id);
        if (index !== -1) {
            socketIds[userId].splice(index, 1);
        }
        // console.log(socketIds[userId])
    });
    socket.on('chatmessage', async (msg) => {
        console.log(msg.token)
        if (msg.token && msg.receiverId) {
            try {
                decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
                msg.senderId = decoded.id;
                delete msg.token;
                msg.time = new Date();
                await chatController.saveMessage(msg);
                if(socketIds[msg.senderId]){
                    for(let i = 0; i< socketIds[msg.senderId].length; i++){
                        io.to(socketIds[msg.senderId][i]).emit('message', msg);
                    }
                }
                if(socketIds[msg.receiverId]){
                    for(let i = 0; i< socketIds[msg.receiverId].length; i++){
                        io.to(socketIds[msg.receiverId][i]).emit('message', msg);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    })
});


chatServer.listen(3000, () => {
    console.log("server chat start - " + 3000);
})
