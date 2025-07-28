const Listing = require("../models/listing");
// const fetch = require("node-fetch");

// module.exports.index = async (req, res) => {
//   const allListing = await Listing.find({});
//   res.render("listings/index.ejs", { allListing });
// };

module.exports.index = async (req, res) => {
  const { category } = req.query;
  let allListing;

  if (category) {
    allListing = await Listing.find({ category: category });
  } else {
    allListing = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListing, category });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.renderBookForm = (req, res) => {
  const { id } = req.params;
  res.render("listings/book.ejs", { listingId: id });
};

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("=== CREATE LISTING START ===");

    // ✅ Check if user exists
    if (!req.user) {
      throw new Error("User not logged in. req.user is undefined.");
    }
    console.log("User:", req.user);

    // ✅ Check uploaded file
    if (!req.file || !req.file.path || !req.file.filename) {
      throw new Error("File upload failed: req.file is missing or invalid.");
    }
    console.log("Uploaded file:", req.file);

    let url = req.file.path;
    let filename = req.file.filename;

    // ✅ Check location field
    if (!req.body.listing || !req.body.listing.location) {
      throw new Error("No location provided in the request body.");
    }
    const { location } = req.body.listing;
    console.log("Location received:", location);

    // ✅ Geocode request
    console.log("Calling Nominatim API...");
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
    console.log("GeoResponse status:", geoResponse.status);

    if (!geoResponse.ok) {
      throw new Error(`Nominatim API request failed: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    console.log("GeoData:", geoData);

    if (!geoData || geoData.length === 0) {
      req.flash("error", "Location not found on map.");
      console.error("No geocoding results.");
      return res.redirect("/listings/new");
    }

    const coordinates = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];
    console.log("Coordinates:", coordinates);

    // ✅ Create listing object
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = {
      type: "Point",
      coordinates: coordinates,
    };

    console.log("Saving listing to DB...");
    await newListing.save();

    req.flash("success", "New Listing Created!");
    console.log("=== CREATE LISTING SUCCESS ===");
    res.redirect("/listings");

  } catch (err) {
    console.error("=== CREATE LISTING ERROR ===");
    console.error(err);
    next(err); // Pass error to Express error handler (shows in Render logs)
  }
};


module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  //console.log(listing);
  res.render("listings/show", { listing, script: "/js/map.js" });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let orginalImg = listing.image.url;
  orginalImg = orginalImg.replace("/upload", "/upload/w_250");
  // res.render("listings/edit.ejs", { listing, orginalImg });
  res.render("listings/edit.ejs", {
    listing,
    script: "/js/editMap.js",
    orginalImg,
  });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body.listing;

  // Step 1: Geocode the updated location using Nominatim (OpenStreetMap)
  const geoResponse = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${updatedData.location}`
  );
  const geoData = await geoResponse.json();

  if (geoData.length === 0) {
    req.flash("error", "Invalid location. Could not geocode.");
    return res.redirect(`/listings/${id}/edit`);
  }

  // Step 2: Update listing with new data
  const listing = await Listing.findById(id);
  listing.title = updatedData.title;
  listing.description = updatedData.description;
  listing.price = updatedData.price;
  listing.country = updatedData.country;
  listing.location = updatedData.location;
  listing.category = updatedData.category;

  // Step 3: Update geometry (map coordinates)
  listing.geometry = {
    type: "Point",
    coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)],
  };

  // Step 4: If image uploaded, update it
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  // Step 5: Save everything
  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
