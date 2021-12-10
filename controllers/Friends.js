const jwt = require("jsonwebtoken");
const UserModel = require("../models/Users");
const FriendModel = require("../models/Friends");
const httpStatus = require("../utils/httpStatus");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("../constants/constants");
const { ROLE_CUSTOMER } = require("../constants/constants");
const friendsController = {};

// 0: gửi lời mời
// 1: kết bạn
// 2: từ chối
// 3: hủy kết bạn

friendsController.setRequest = async (req, res, next) => {
    try {
        let sender = req.userId;
        let receiver = req.body.user_id;
        let checkBack = await FriendModel.findOne({ sender: receiver, receiver: sender, status: { $in: ["0", "1"] } });
        if (checkBack != null) {
            if (checkBack.status == '0' || checkBack.status == '1') {
                return res.status(200).json({
                    code: 200,
                    newStatus: checkBack.status == '1' ? 'friend' : 'not friend',
                    success: false,
                    message: "Đối phương đã gửi lời mời kết bạn hoặc đã là bạn",
                });
            }
            checkBack.status = '0';

        }

        let isFriend = await FriendModel.findOne({ sender: sender, receiver: receiver });
        if (isFriend != null) {
            if (isFriend.status == '1') {
                return res.status(200).json({
                    code: 200,
                    newStatus: 'sent',
                    success: false,
                    message: "Đã gửi lời mời kết bạn trước đó",
                });
            }

            isFriend.status = '0';
            isFriend.save();
            res.status(200).json({
                code: 200,
                message: "Gửi lời mời kết bạn thành công",
                newStatus: 'sent'
            });

        } else {
            let status = 0;
            const makeFriend = new FriendModel({ sender: sender, receiver: receiver, status: status });
            await makeFriend.save();
            res.status(200).json({
                code: 200,
                message: "Gửi lời mời kết bạn thành công",
                data: makeFriend,
                newStatus: 'sent'
            });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

friendsController.getRequest = async (req, res, next) => {
    try {
        let receiver = req.userId;
        let requested = await FriendModel.find({ receiver: receiver, status: "0" }).distinct('sender')
        let users = await UserModel.find().where('_id').in(requested).populate('avatar').populate('cover_image').exec()

        res.status(200).json({
            code: 200,
            message: "Danh sách lời mời kết bạn",
            data: {
                friends: users,
            }
        });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

friendsController.setAccept = async (req, res, next) => {
    try {
        let receiver = req.userId;
        let sender = req.body.user_id;

        let friend = await FriendModel.findOne({ sender: sender, receiver: receiver, status: { $in: ["0", "1"] } });

        if (req.body.is_accept != '1' && req.body.is_accept != '2') {
            res.status(200).json({
                code: 200,
                message: "Không đúng yêu cầu",
                data: friend,
                success: false,
                newStatus: friend.status
            });
            return;
        }
        if (friend.status == '1' && req.body.is_accept == '2') {
            res.status(200).json({
                code: 200,
                message: "Không đúng yêu cầu",
                data: friend,
                success: false,
                newStatus: 'friend'
            });
            return;
        }

        friend.status = req.body.is_accept;
        friend.save();
        let newStatus = ''
        let mes;
        if (req.body.is_accept === '1') {
            mes = "Kết bạn thành công";
            newStatus = 'friend'
        } else {
            mes = "Từ chối thành công";
            newStatus = 'not friend'
        }

        res.status(200).json({
            code: 200,
            message: mes,
            data: friend,
            success: true,
            newStatus: newStatus
        });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

friendsController.setRemoveFriend = async (req, res, next) => {
    try {
        let receiver = req.userId;
        let sender = req.body.user_id;

        let friendRc1 = await FriendModel.findOne({ sender: sender, receiver: receiver ,  status: '1'});
        let friendRc2 = await FriendModel.findOne({ sender: receiver, receiver: sender, status: '1' });
        let final;
        if (friendRc1 == null) {
            final = friendRc2;
        } else {
            final = friendRc1;
        }
        if (final.status != '1') {
            res.status(200).json({
                code: 200,
                success: false,
                message: "Khong thể thao tác",
            });
        }

        final.status = '3';
        final.save();

        res.status(200).json({
            code: 200,
            success: true,
            message: "Xóa bạn thành công",
            data: final
        });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

friendsController.listFriends = async (req, res, next) => {
    try {
        // console.log(req);
        if (req.body.user_id == null) {
            let requested = await FriendModel.find({ sender: req.userId, status: "1" }).distinct('receiver')
            let accepted = await FriendModel.find({ receiver: req.userId, status: "1" }).distinct('sender')

            let users = await UserModel.find().where('_id').in(requested.concat(accepted)).populate('avatar').populate('cover_image').exec()

            res.status(200).json({
                code: 200,
                message: "Danh sách bạn bè",
                data: {
                    friends: users,
                }
            });
        }

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


friendsController.listRequests = async (req, res, next) => {
    try {
        let list = await FriendModel.find({
            $and: [
                {
                    $or: [
                        { sender: req.userId },
                        { receiver: req.userId }
                    ]
                },
                { status: "0" }
            ]
        }).populate({
            path: 'sender',
            model: 'Users',
            populate: {
                path: 'avatar',
                model: 'Documents'
            }
        }).populate({
            path: 'receiver',
            model: 'Users',
            populate: {
                path: 'avatar',
                model: 'Documents'
            }
        })

        let sentList = [];
        let receivedList = [];
        for (let i = 0; i < list.length; i++) {
            if (list[i].sender._id == req.userId) {
                sentList.push(list[i]);
            } else {
                receivedList.push(list[i]);
            }
        }

        res.status(200).json({
            data: {
                sentList,
                receivedList
            }
        });


    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}

friendsController.getFriendStatus = async (userId, friendId) =>{
    try {
        let friendRecord = await FriendModel.findOne({
            $and: [
                {
                    $or: [
                        { sender: userId, receiver: friendId },
                        { receiver: userId, sender: friendId }
                    ]
                },
                { status: { $in: ["0", "1"] } }
            ]
        })

        let status = "";
        if (friendRecord === null) {
            status = "not friend"
        } else if (friendRecord.status == "1") {
            status = "friend"
        } else {
            if (friendRecord.sender == userId) {
                status = "sent"
            } else {
                status = "received"
            }
        }
        return status;

    } catch (e) {
        console.log(e);
    }
} 


friendsController.friendStatus = async (req, res, next) => {
    let friendId = req.params.friendId;
    try {
        let friendRecord = await FriendModel.findOne({
            $and: [
                {
                    $or: [
                        { sender: req.userId, receiver: friendId },
                        { receiver: req.userId, sender: friendId }
                    ]
                },
                { status: { $in: ["0", "1"] } }
            ]
        })

        let status = "";
        if (friendRecord === null) {
            status = "not friend"
        } else if (friendRecord.status == "1") {
            status = "friend"
        } else {
            if (friendRecord.sender == req.userId) {
                status = "sent"
            } else {
                status = "received"
            }
        }

        res.status(200).json({
            data: {
                status: status,
            }
        });


    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


friendsController.cancelRequest = async (req, res, next) => {
    try {
        let sender = req.userId;
        let receiver = req.body.user_id;
        let checkBack = await FriendModel.findOne({ sender: sender, receiver: receiver, status: { $in: ["0", "1"] } });
        if (checkBack != null) {
            let status = checkBack.status;
            if (checkBack.status == '0'){
                checkBack.status = '3';
                await checkBack.save();
            }

            return res.status(200).json({
                code: 200,
                newStatus: status == '1' ? 'friend' : 'not friend',
                success: true,
                message: status == '1' ? "Không thể huỷ yêu cầu kết bạn vì đã là bạn" :"Huỷ kết bạn thành công",
            });


        } else {
            let checkBack = await FriendModel.findOne({ sender: receiver, receiver: sender, status: { $in: ["0", "1"] } });
            if (checkBack != null) {
                let status = checkBack.status;
                return res.status(200).json({
                    code: 200,
                    newStatus: status == '1' ? 'friend' : 'received',
                    success: false,
                    message: status == '1' ? "Không thể huỷ yêu cầu kết bạn vì đã là bạn" :"Bạn không phải người gửi lời mời kết bạn",
                });
    
            }
            return res.status(200).json({
                code: 200,
                newStatus: 'not friend',
                success: false,
                message: "Chưa gủi lời mới kết bạn",
            });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: e.message
        });
    }
}


module.exports = friendsController;