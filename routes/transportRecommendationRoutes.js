const express = require("express");

const {
  processTransportRecommendations,
} = require("../controllers/transportRecommendationController.js");

const router = express.Router();

router.post("/recommend", processTransportRecommendations);

module.exports = router;
