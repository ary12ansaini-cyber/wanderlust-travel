const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middlewares.js");
const reviewController = require("../controllers/review.js");

// Post Review Route
router
  .route("/")
  .post(
    isLoggedIn,
    validateReview,
    wrapAsync(reviewController.createReview)
  );

// Delete Review Route
router
  .route("/:reviewId")
  .delete(
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview)
  );

module.exports = router;
