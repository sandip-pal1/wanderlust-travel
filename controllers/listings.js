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

    if (!req.user) {
      throw new Error("User not logged in. req.user is undefined.");
    }

    if (!req.file || !req.file.path || !req.file.filename) {
      throw new Error("File upload failed: req.file is missing or invalid.");
    }

    let url = req.file.path;
    let filename = req.file.filename;

    if (!req.body.listing || !req.body.listing.location) {
      throw new Error("No location provided in the request body.");
    }

    const { location } = req.body.listing;

    // ✅ Nominatim with User-Agent including your email
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
      {
        headers: {
          "User-Agent": "WanderlustApp/1.0 (palteam3@gmail.com)"
        }
      }
    );

    if (!geoResponse.ok) {
      throw new Error(`Nominatim API request failed: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      req.flash("error", "Location not found on map.");
      return res.redirect("/listings/new");
    }

    const coordinates = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = {
      type: "Point",
      coordinates: coordinates,
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");

  } catch (err) {
    console.error("CREATE LISTING ERROR:", err);
    next(err);
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

module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedData = req.body.listing;

    if (!updatedData.location) {
      throw new Error("Location missing in update form.");
    }

    // ✅ Nominatim with User-Agent including your email
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(updatedData.location)}`,
      {
        headers: {
          "User-Agent": "WanderlustApp/1.0 (palteam3@gmail.com)"
        }
      }
    );

    if (!geoResponse.ok) {
      throw new Error(`Nominatim API request failed: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      req.flash("error", "Invalid location. Could not geocode.");
      return res.redirect(`/listings/${id}/edit`);
    }

    const listing = await Listing.findById(id);
    listing.title = updatedData.title;
    listing.description = updatedData.description;
    listing.price = updatedData.price;
    listing.country = updatedData.country;
    listing.location = updatedData.location;
    listing.category = updatedData.category;

    listing.geometry = {
      type: "Point",
      coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)],
    };

    if (req.file) {
      listing.image = { url: req.file.path, filename: req.file.filename };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);

  } catch (err) {
    console.error("UPDATE LISTING ERROR:", err);
    next(err);
  }
};


module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
