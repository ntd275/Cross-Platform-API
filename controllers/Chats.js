const {
    PRIVATE_CHAT,
    GROUP_CHAT,
} = require('../constants/constants');
const ChatModel = require("../models/Chats");
const MessagesModel = require("../models/Messages");
const httpStatus = require("../utils/httpStatus");
const chatController = {};
chatController.send = async (req, res, next) => {
    try {
        let userId = req.userId;
        const {
            name,
            chatId,
            receivedId,
            member,
            type,
            content
        } = req.body;
        let chatIdSend = null;
        let chat;
        if (type === PRIVATE_CHAT) {
            if (chatId) {
                chat = await ChatModel.findById(chatId);
                if (chat !== null) {
                    chatIdSend = chat._id;
                }
            } else {
                chat = new ChatModel({
                    type: PRIVATE_CHAT,
                    member: [
                        receivedId,
                        userId
                    ]
                });
                await chat.save();
                chatIdSend = chat._id;
            }
        } else if (type === GROUP_CHAT) {
            if (chatId) {
                chat = await ChatModel.findById(chatId);
                if (chat !== null) {
                    chatIdSend = chat._id;
                }
            } else {
                chat = new ChatModel({
                    type: GROUP_CHAT,
                    member: member
                });
                await chat.save();
                chatIdSend = chat._id;
            }
        }
        if (chatIdSend) {
            if (content) {
                let message = new MessagesModel({
                    chat: chatIdSend,
                    user: userId,
                    content: content
                });
                await message.save();
                let messageNew = await MessagesModel.findById(message._id).populate('chat').populate('user');
                return res.status(httpStatus.OK).json({
                    data: messageNew
                });
            } else {
                return res.status(httpStatus.OK).json({
                    data: chat,
                    message: 'Create chat success',
                    response: 'CREATE_CHAT_SUCCESS'
                });
            }
        } else {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: 'Not chat'
            });
        }

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}
chatController.getMessages = async (req, res, next) => {
    try {
        let messages = await MessagesModel.find({
            chat: req.params.chatId
        }).populate('user');
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: messages
        });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

chatController.saveMessage = async (msg) => {
    try {
        let chat = null;
        if (msg.chatId) {
            chat = chat = await ChatModel.findOne({
                $and: [
                    { _id: msg.chatId },
                    { members: { $all: [msg.senderId, msg.receiverId] } },
                    { members: { $size: 2 } }
                ]
            });
        }

        if (!chat) {
            chat = await ChatModel.findOne({
                $and: [
                    { members: { $all: [msg.senderId, msg.receiverId] } },
                    { members: { $size: 2 } }
                ]
            });
        }

        if (!chat) {
            chat = new  ChatModel({
                messsages: [],
                members: [msg.senderId, msg.receiverId] ,
                seens: [true, true],
            });
        }

        // console.log(chat)
        let message = new MessagesModel({
            time: msg.time,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
        });
        await message.save();
        chat.messsages.push(message);
        for(let i =0; i< chat.members.length; i++){
            if(chat.members[i] != msg.senderId){
                console.log(i);
                console.log(chat.members[i] + "   - -- "+ msg.senderId);
                chat.seens[i] = false;
            }else{
                chat.seens[i] = true;
            }
        }
        chat.save();
    } catch (e) {
        console.log(e);
    }
}

module.exports = chatController;