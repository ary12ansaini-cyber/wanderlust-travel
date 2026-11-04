const Listing = require("../models/listing.js");
const { geocodeLocation } = require("../utils/geocode.js");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (typeof req.file !== "undefined") {
    let url = req.file.path || req.file.url || `/uploads/${req.file.filename}`;
    let filename = req.file.filename;
    newListing.image = { url, filename };
  } else if (
    !newListing.image ||
    (typeof newListing.image === "object" && !newListing.image.url)
  ) {
    newListing.image = {
      url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3",
      filename: "listingimage",
    };
  }

  // Dynamic Geocoding: Convert address/location to GeoJSON coordinates
  const locationQuery = `${newListing.location || ""}, ${newListing.country || ""}`;
  const geometry = await geocodeLocation(locationQuery);
  newListing.geometry = geometry;

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  let originalImageUrl = "";
  if (listing.image) {
    originalImageUrl =
      typeof listing.image === "string"
        ? listing.image
        : listing.image.url || "";
  }
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Update textual properties
  if (req.body.listing) {
    if (req.body.listing.title) listing.title = req.body.listing.title;
    if (req.body.listing.description) listing.description = req.body.listing.description;
    if (req.body.listing.price) listing.price = req.body.listing.price;
    if (req.body.listing.country) listing.country = req.body.listing.country;
    if (req.body.listing.location) listing.location = req.body.listing.location;

    // Dynamic Geocoding on location update
    if (req.body.listing.location || req.body.listing.country) {
      const locationQuery = `${listing.location || ""}, ${listing.country || ""}`;
      listing.geometry = await geocodeLocation(locationQuery);
    }
  }

  // Update photo if uploaded
  if (typeof req.file !== "undefined") {
    let url = req.file.path || req.file.url || `/uploads/${req.file.filename}`;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deleteListing = await Listing.findByIdAndDelete(id);
  if (!deleteListing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
