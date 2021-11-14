const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema({
    time: {
        type: Date,
        required: false
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
    },
    content: {
        type: String,
        required: false
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chats"
    }
});
messagesSchema.set('timestamps', true);
module.exports = mongoose.model('Messages', messagesSchema);
