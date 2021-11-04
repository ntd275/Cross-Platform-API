require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mainRouter = require("./routes/index");
const {PORT} = require("./constants/constants");
const {MONGO_URI} = require("./constants/constants");
const bodyParser = require('body-parser');
const app = express();
const app2 = express();
const http = require('http');
const chatServer = http.createServer(app2);
const { Server } = require("socket.io");
const io = new Server(chatServer);
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
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
// route middleware
app.use("/", mainRouter);

app.get('/settings', function (req, res) {
    res.send('Settings Page');
});


app.listen(PORT, () => {
    console.log("server start - " + PORT);
})

const socketIds = {};

// Socket.io chat realtime
io.on('connection', (socket) => {
    // MessageModel.find().then(result => {
    //     socket.emit('output-messages', result)
    // })
    console.log('a user connected: ' + socket.options);
    socket.emit('message', 'Hello world');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('chatmessage', msg => {
        // const message = new MessageModel({ msg });
        message.save().then(() => {
            io.emit('message', msg)
        })
    })
});


chatServer.listen(3000, () => {
    console.log("server chat start - " + 3000);
})
