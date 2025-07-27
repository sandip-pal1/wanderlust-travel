// routes/listing.js
const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer ({storage})


router.route("/")
.get( wrapAsync(listingController.index))
.post(
  isLoggedIn,
  validateListing,
  upload.single("listing[image]"),
  wrapAsync(listingController.createListing)
);



//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.post("/:id/book", isLoggedIn, (req, res) => {
  req.flash("success", "Booking confirmed successfully!");
  res.redirect(`/listings/${req.params.id}`);
});


//edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);




//book route 
router.get("/:id/book", isLoggedIn, listingController.renderBookForm);


router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put(
  isLoggedIn,
  isOwner,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(listingController.updateListing)
).delete(
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.destroyListing)
);





module.exports = router;
