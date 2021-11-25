const {
    PRIVATE_CHAT,
    GROUP_CHAT,
} = require('../constants/constants');
const ChatModel = require("../models/Chats");
const MessagesModel = require("../models/Messages");
const httpStatus = require("../utils/httpStatus");
const chatController = {};

chatController.getMessages = async (req, res, next) => {
    try {
        let chat = await ChatModel.findOne({
            $and: [
                { _id: req.params.chatId },
                { members: req.userId }
            ]
        }).populate('messsages');
        if (chat !== null) {
            let pivots = chat.pivots;
            let curPivot = 0;
            for (let i = 0; i < chat.members.length; i++) {
                if (chat.members[i] == req.userId) {
                    curPivot = pivots[i];
                    break;
                }
            }
            messsages = chat.messsages;
            messsages.splice(0, curPivot);
            for(let i =0; i< messsages.length; i++){
                if(messsages[i].isRecall){
                    messsages[i].content = 'Tin nhắn đã được thu hồi';
                }
            }
            return res.status(httpStatus.OK).json({
                blockers: chat.blockers,
                chatId: chat._id,
                data: messsages
            });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Not found conversation!" });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


chatController.getMessagesByFriendId = async (req, res, next) => {
    try {
        let chat = await ChatModel.findOne({
            $and: [
                { members: { $all: [req.userId, req.params.friendId] } },
                { members: { $size: 2 } }
            ]
        }).populate('messsages');
        if (chat !== null) {
            let pivots = chat.pivots;
            let curPivot = 0;
            for (let i = 0; i < chat.members.length; i++) {
                if (chat.members[i] == req.userId) {
                    curPivot = pivots[i];
                    break;
                }
            }
            messsages = chat.messsages;
            messsages.splice(0, curPivot);
            for(let i =0; i< messsages.length; i++){
                if(messsages[i].isRecall){
                    messsages[i].content = 'Tin nhắn đã được thu hồi';
                }
            }
            return res.status(httpStatus.OK).json({
                blockers: chat.blockers,
                chatId: chat._id,
                data: messsages
            });
        } else {
            chat = new ChatModel({
                messsages: [],
                members: [req.userId, req.params.friendId],
                seens: [true, true],
                pivots: [0, 0],
                blockers: [],
            });
            await chat.save();
            return res.status(httpStatus.OK).json({
                blockers: [],
                chatId: chat._id,
                data: []
            });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

chatController.deleteChat = async (req, res, next) => {
    try {
        let chat = await ChatModel.findOne({
            $and: [
                { _id: req.params.chatId },
                { members: req.userId }
            ]
        });
        if (chat != null) {
            let newPivot = chat.messsages.length;
            let pivots = chat.pivots;
            for (let i = 0; i < chat.members.length; i++) {
                if (chat.members[i] == req.userId) {
                    pivots[i] = newPivot;
                    break;
                }
            }
            await ChatModel.updateOne({
                $and: [
                    { _id: req.params.chatId },
                    { members: req.userId }
                ]
            }, { pivots: pivots });
            return res.status(httpStatus.OK).json({
                message: "conversation deleted"
            });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Not found conversation!" });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


chatController.getChats = async (req, res, next) => {
    try {
        let chats = await ChatModel.find({ members: req.userId }).populate({
            path: 'members',
            model: 'Users',
            populate: {
                path: 'avatar',
                model: 'Documents'
            }
        });
        let results = [];
        for (let i = 0; i < chats.length; i++) {
            let res = {
                chatId: chats[i]._id,
                lastMessage: null,
                friend: null,
                seen: false,
                blockers: chats[i].blockers,
            };
            let curPivot = 0;
            for (let j = 0; j < chats[i].members.length; j++) {
                if (chats[i].members[j]._id != req.userId) {
                    res.friend = chats[i].members[j];
                    res.seen = chats[i].seens[(j + 1) % 2];
                } else {
                    curPivot = chats[i].pivots[j];
                }
            }
            if (curPivot >= chats[i].messsages.length) {
                continue;
            }
            res.lastMessage = await MessagesModel.findOne({ _id: chats[i].messsages[chats[i].messsages.length - 1] });
            if(res.lastMessage.isRecall){
                res.lastMessage.content = 'Tin nhắn đã được thu hồi';
            }
            results.push(res);
        }

        return res.status(httpStatus.OK).json({
            data: results
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
        let needUpdate = true;
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
            chat = new ChatModel({
                messsages: [],
                members: [msg.senderId, msg.receiverId],
                seens: [true, false],
                pivots: [0, 0],
                blockers: [],
            });
            needUpdate = false;
        } else if (chat.blockers.length > 0 && chat.blockers.indexOf(msg.receiverId) !== -1) return null;

        // console.log(chat)
        let message = new MessagesModel({
            time: msg.time,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            chatId: chat._id
        });
        await message.save();
        chat.messsages.push(message);
        await chat.save();

        if (needUpdate) {
            let seens = [false, false];
            for (let i = 0; i < chat.members.length; i++) {
                if (chat.members[i] != msg.senderId) {
                    seens[i] = false;
                } else {
                    seens[i] = true;
                }
            }
            await ChatModel.updateOne({ _id: chat._id }, { seens: seens });
        }

        return {chatId: chat._id, msgId: message._id};
    } catch (e) {
        console.log(e);
    }
}


chatController.seenMessage = async (msg) => {
    try {
        let chat = await ChatModel.findOne({
            $and: [
                { _id: msg.chatId },
                { members: msg.userId }
            ]
        }).populate('messsages');
        if (chat == null) {
            return;
        }
        let seens = chat.seens;
        for (let i = 0; i < chat.members.length; i++) {
            if (chat.members[i]._id == msg.userId) {
                seens[i] = true;
                break;
            }
        }
        await ChatModel.updateOne({ _id: msg.chatId }, { seens: seens });
    } catch (e) {
        console.log(e);
    }
}


chatController.blockChat = async (msg) => {
    try {
        let chat = await ChatModel.findOne({
            $and: [
                { _id: msg.chatId },
                { members: { $all: [msg.senderId, msg.receiverId] } },
                { members: { $size: 2 } }
            ]
        });
        if (chat ==null){
            chat = await ChatModel.findOne({
                $and: [
                    { members: { $all: [msg.senderId, msg.receiverId] } },
                    { members: { $size: 2 } }
                ]
            });
        }

        if (chat != null) {
            let newBlockers = chat.blockers;
            if(newBlockers.indexOf(msg.senderId) == -1){
                newBlockers.push(msg.senderId);
                chat.blockers = newBlockers;
                await chat.save();
            }
            return {
                blockers: newBlockers,
                chatId: chat._id
            }
        } else {
            chat = new ChatModel({
                messsages: [],
                members: [msg.senderId, msg.receiverId],
                seens: [true, true],
                pivots: [0, 0],
                blockers: [msg.senderId],
            });
            await chat.save();
            return {
                blockers: [msg.senderId],
                chatId: chat._id
            }
        }
    } catch (e) {
        console.log(e)
        return null;
    }
}


chatController.unBlockChat = async (msg) => {
    try {
        let chat = await ChatModel.findOne({
            $and: [
                { _id: msg.chatId },
                { members: { $all: [msg.senderId, msg.receiverId] } },
                { members: { $size: 2 } }
            ]
        });
        if (chat ==null){
            chat = await ChatModel.findOne({
                $and: [
                    { members: { $all: [msg.senderId, msg.receiverId] } },
                    { members: { $size: 2 } }
                ]
            });
        }
        if (chat != null) {
            let newBlockers = chat.blockers;
            let index = newBlockers.indexOf(msg.senderId) ;
            if(index != -1){
                newBlockers.splice(index, 1);
                chat.blockers = newBlockers;
                await chat.save();
            }
          
            return {
                blockers: newBlockers,
                chatId: chat._id
            }
        } else {
            return null;
        }
    } catch (e) {
        console.log(e)
        return null;
    }
}



chatController.recallMessage = async (msg) => {
    try {
        let chat = null;
        let needUpdate = true;
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



        if (!chat || msg.index < 0) {
            return null;
        }

        let pivot = chat.pivots[chat.members.indexOf(msg.senderId)];
        let index = msg.index + pivot;
        if(index >= chat.messsages.length) return null;
      
        let message = await MessagesModel.findOne({_id: chat.messsages[index]});
        if(message == null || message.isRecall || message.senderId !=msg.senderId) return null;
        console.log("n")
        message.isRecall = true;
        await message.save();
        message.content = 'Tin nhắn đã được thu hồi';
        return message;
    } catch (e) {
        console.log(e);
    }
}



module.exports = chatController;