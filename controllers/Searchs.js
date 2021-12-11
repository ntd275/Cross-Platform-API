const ChatModel = require("../models/Chats");
const FriendModel = require("../models/Friends");
const Messages = require("../models/Messages");
const MessagesModel = require("../models/Messages");
const httpStatus = require("../utils/httpStatus");
const UserModel = require("../models/Users");
const friendController = require("./Friends")
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

        friendList = await UserModel.find({
            $and: [
                { _id: { $in: friendIds } },
                {
                    $or: [
                        { username: { "$regex": key, "$options": "i" } },
                        { phonenumber: { "$regex": key, "$options": "i" } }
                    ]
                }
            ]
        }).populate('avatar').limit(10);

        friendIds.push(userId);

        peopleList = await UserModel.find({
            $and: [
                { _id: { $nin: friendIds } },
                {
                    $or: [
                        { username: { "$regex": key, "$options": "i" } },
                        { phonenumber: { "$regex": key, "$options": "i" } }
                    ]
                }
            ]
        }).populate('avatar').limit(5);

        let temp = [];

        for(let i =0; i< peopleList.length; i++){
            let friendStatus = await friendController.getFriendStatus(userId, peopleList[i]._id);
            let object = {
                gender : peopleList[i].gender,
                blocked_inbox : peopleList[i].blocked_inbox,
                blocked_diary : peopleList[i].blocked_diary,
                _id : peopleList[i]._id,
                phonenumber : peopleList[i].phonenumber,
                username : peopleList[i].username,
                avatar : peopleList[i].avatar,
                cover_image : peopleList[i].avatar,
                friendStatus : friendStatus
            }
            temp.push(object)
        }
        peopleList = temp;

        let messages = await MessagesModel.find({
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
        }).limit(10);

        for (let i = 0; i < messages.length; i++) {
            let message = {};
            message.content = messages[i].content;
            message.time = messages[i].time;
            message.chatId = messages[i].chatId;
            message.senderId = messages[i].senderId;
            if (messages[i].senderId._id == userId) {
                message["friend"] = messages[i].receiverId;
            } else {
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