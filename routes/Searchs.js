const searchController = require("../controllers/Searchs");
const {asyncWrapper} = require("../utils/asyncWrapper");
const express = require("express");
const searchRoutes = express.Router();
const auth = require("../middlewares/auth");

searchRoutes.get(
    "/:key",
    auth,
    asyncWrapper(searchController.search),
);

module.exports = searchRoutes;