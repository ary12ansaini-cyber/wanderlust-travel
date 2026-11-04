const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: Schema.Types.Mixed,
    default: {
      url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3",
      filename: "listingimage",
    },
    set: (v) => {
      if (!v) {
        return {
          url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3",
          filename: "listingimage",
        };
      }
      if (typeof v === "string") {
        return {
          url: v,
          filename: "listingimage",
        };
      }
      if (typeof v === "object") {
        return {
          url:
            v.url ||
            "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3",
          filename: v.filename || "listingimage",
        };
      }
      return v;
    },
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [77.209, 28.6139],
    },
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;