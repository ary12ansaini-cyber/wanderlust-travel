const path = require("path");

if (process.env.NODE_ENV != "production") {
  try {
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
  } catch (e) {}
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

let DB_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
if (DB_URL.includes(".net/?")) {
  DB_URL = DB_URL.replace(".net/?", ".net/wanderlust?");
} else if (DB_URL.endsWith(".net/") || DB_URL.endsWith(".net")) {
  DB_URL = DB_URL.replace(/\/?$/, "/wanderlust?retryWrites=true&w=majority");
}

async function main() {
  await mongoose.connect(DB_URL);
  console.log("Connected to Database:", DB_URL.includes("mongodb.net") ? "MongoDB Atlas" : "Local MongoDB");
  await initDB();
  await mongoose.connection.close();
  console.log("Connection closed.");
}

const initDB = async () => {
  await Listing.deleteMany({});

  // Ensure a valid user exists to own these listings
  let ownerId;
  const existingUser = await User.findOne({});
  if (existingUser) {
    ownerId = existingUser._id;
  } else {
    try {
      const demoUser = new User({
        email: "demo@wanderlust.com",
        username: "demo_admin",
      });
      const registeredUser = await User.register(demoUser, "demopassword123");
      ownerId = registeredUser._id;
    } catch (e) {
      ownerId = "65326f898945d63e510e2655";
    }
  }

  const rawData = initData.data || initData;
  const listingsToInsert = rawData.map((obj) => ({
    ...obj,
    owner: ownerId,
  }));

  await Listing.insertMany(listingsToInsert);
  console.log(`Data was initialized successfully! (${listingsToInsert.length} listings inserted)`);
};

main().catch((err) => {
  console.error("Initialization Error:", err.message);
});
