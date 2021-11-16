const {
    PRIVATE_CHAT,
    GROUP_CHAT,
} = require('../constants/constants');
const mongoose = require("mongoose");

const chatsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    messsages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Messages"
        }
    ],
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        }
    ],
    blockers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        }
    ],
    seens: [
        {
            type: Boolean,
            require: false
        }
    ],
    pivots: [
        {
            type: Number,
            require: false,
        }
    ]
    ,
    type: {
        type: String,
        enum: [
            PRIVATE_CHAT,
            GROUP_CHAT,
        ],
        required: false,
        default: PRIVATE_CHAT
    }
});
chatsSchema.set('timestamps', true);
module.exports = mongoose.model('Chats', chatsSchema);
