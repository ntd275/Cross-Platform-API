const ChatModel = require("../models/Chats");
const FriendModel = require("../models/Friends");
const Messages = require("../models/Messages");
const MessagesModel = require("../models/Messages");
const Users = require("../models/Users");
const httpStatus = require("../utils/httpStatus");
const searchController = {};

searchController.search = async (req, res, next) => {
    try {
        let key = req.params.key;
        userId = req.userId;
        let friendList = [];
        let peopleList = [];
        let messageList = [];
        let friends = await FriendModel.find({
            $and: [
                {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                },
                { status: "1" }
            ]

        }).populate('messsages');

        let friendIds = [];
        for (let i = 0; i < friends.length; i++) {
            if (friends[i].sender == userId) {
                friendIds.push(friends[i].receiver);
            } else {
                friendIds.push(friends[i].sender);
            }
        }

        friendList = UserModel.find({
            $and: [
                { _id: { $in: friendIds } },
                {
                    $or: [
                        { username: { "$regex": key, "$options": "i" } },
                        { phonenumber: { "$regex": key, "$options": "i" } }
                    ]
                }
            ]
        }).populate('avatar');

        peopleList = UserModel.find({
            $and: [
                { _id: { $nin: friendIds } },
                {
                    $or: [
                        { username: { "$regex": key, "$options": "i" } },
                        { phonenumber: { "$regex": key, "$options": "i" } }
                    ]
                }
            ]
        }).populate('avatar');

        let messages = MessagesModel.find({
            $and: [
                {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                },
                { content: { "$regex": key, "$options": "i" } },
            ]
        }).populate({
            path: 'senderId',
            model: 'Users',
            populate: {
                path: 'avatar',
                model: 'Documents'
            }
        }).populate({
            path: 'receiverId',
            model: 'Users',
            populate: {
                path: 'avatar',
                model: 'Documents'
            }
        });

        for(let i = 0; i< messages.length; i++){
            let message = {};
            message.content = messages[i].content;
            message.time = messages[i].time;
            message.chatId = messages[i].chatId;
            if(messages[i].senderId._id == userId){
                message["friend"] = messages[i].receiverId;
            }else{
                message["friend"] = messages[i].senderId;
            }

            messageList.push(message);
        }

        return res.status(httpStatus.OK).json({
            data: {
                friends: friendList,
                people: peopleList,
                messages: messageList
            }
        });

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


module.exports = searchController;