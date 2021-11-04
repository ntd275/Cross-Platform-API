const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema({
    time: {
        type: Date,
        required: false
    },
    senderId: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    }
});
messagesSchema.set('timestamps', true);
module.exports = mongoose.model('Messages', messagesSchema);
