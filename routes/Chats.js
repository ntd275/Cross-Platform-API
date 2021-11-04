const chatController = require("../controllers/Chats");
const {asyncWrapper} = require("../utils/asyncWrapper");
const express = require("express");
const chatsRoutes = express.Router();
const auth = require("../middlewares/auth");

chatsRoutes.get(
    "/getMessages/:chatId",
    auth,
    asyncWrapper(chatController.getMessages),
);

chatsRoutes.get(
    "/getChats",
    auth,
    asyncWrapper(chatController.getChats),
);

module.exports = chatsRoutes;