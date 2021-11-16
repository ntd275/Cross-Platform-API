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

chatsRoutes.delete(
    "/deleteChat/:chatId",
    auth,
    asyncWrapper(chatController.deleteChat),
);

chatsRoutes.get(
    "/getChats",
    auth,
    asyncWrapper(chatController.getChats),
);

chatsRoutes.get(
    "/block/:chatId",
    auth,
    asyncWrapper(chatController.blockChat),
);

chatsRoutes.get(
    "/unblock/:chatId",
    auth,
    asyncWrapper(chatController.unBlockChat),
);

module.exports = chatsRoutes;