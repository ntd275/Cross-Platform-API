const ChatModel = require("../models/Chats");
const FriendModel = require("../models/Friends")
const MessagesModel = require("../models/Messages");
const httpStatus = require("../utils/httpStatus");
const searchController = {};

searchController.search = async (req, res, next) => {
    try {
        let key = req.params.key;
        userId = req.userId;
        friendList = [];
        peopleList = [];
        messageList = [];
        let chat = await ChatModel.findOne({
            $and: [
                { _id: req.params.chatId },
                { members: req.userId }
            ]
        }).populate('messsages');
        if (chat !== null) {
            let pivots = chat.pivots;
            let curPivot = 0;
            for(let i = 0; i< chat.members.length; i++){
                if(chat.members[i] == req.userId){
                    curPivot = pivots[i];
                    break;
                }
            }
            messsages = chat.messsages;
            messsages.splice(0, curPivot);
            return res.status(httpStatus.OK).json({
                data: messsages
            });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


module.exports = searchController;