const dns = require("dns");
try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in restricted environments
}

process.on("unhandledRejection", (reason, promise) => {
  console.warn("Handled background warning:", reason && reason.message ? reason.message : reason);
});

require("util").isArray = Array.isArray;

if (process.env.NODE_ENV != "production") {
  try {
    require("dotenv").config();
  } catch (e) {
    // dotenv is optional in local environments without .env
  }
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/user.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");

// route require
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// set and use
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// Global default template variables (always defined across all views/layouts)
app.use((req, res, next) => {
  res.locals.success = [];
  res.locals.error = [];
  res.locals.currUser = null;
  next();
});

// db connection
let dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
if (dbUrl.includes(".net/?")) {
  dbUrl = dbUrl.replace(".net/?", ".net/wanderlust?");
} else if (dbUrl.endsWith(".net/") || dbUrl.endsWith(".net")) {
  dbUrl = dbUrl.replace(/\/?$/, "/wanderlust?retryWrites=true&w=majority");
}
const secret = process.env.SECRET || "mysupersecretcode";

const primaryDbUrl = dbUrl;
const localDbUrl = "mongodb://127.0.0.1:27017/wanderlust";

const clientPromise = new Promise((resolve) => {
  if (mongoose.connection.readyState === 1) {
    return resolve(mongoose.connection.getClient());
  }
  mongoose.connection.once("open", () => {
    resolve(mongoose.connection.getClient());
  });
});

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(primaryDbUrl, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB Atlas successfully");
  } catch (err) {
    console.error("MongoDB Atlas Connection Warning:", err.message);
    if (err.code === "EBADRESP" || (err.message && err.message.includes("querySrv"))) {
      console.warn(
        "DNS SRV lookup issue with local network router. Trying local MongoDB fallback..."
      );
    }
    try {
      await mongoose.connect(localDbUrl, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("Connected to local MongoDB successfully (Fallback Mode)");
    } catch (localErr) {
      console.error("Local MongoDB also unavailable:", localErr.message);
      console.warn(
        "Tip: Check if your current IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> 0.0.0.0/0)."
      );
    }
  }
}

connectDB();

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDB();
    } catch (e) {}
  }
  next();
});

// session store configuration: share the active Mongoose client
let store;
try {
  if (MongoStore && typeof MongoStore.create === "function") {
    store = MongoStore.create({
      clientPromise: clientPromise,
      crypto: {
        secret: secret,
      },
      touchAfter: 24 * 3600,
    });

    store.on("error", (err) => {
      console.warn("MongoStore event notice:", err.message);
    });
  }
} catch (err) {
  console.log("MongoStore init notice, falling back to memory session:", err.message);
}

const sessionOption = {
  ...(store ? { store } : {}),
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOption));

// Session error interceptor: if session store has a DNS/connection issue, gracefully continue
app.use((err, req, res, next) => {
  if (err && err.message && (err.message.includes("querySrv") || err.message.includes("session"))) {
    console.warn("Session store warning intercepted, continuing gracefully:", err.message);
    return next();
  }
  next(err);
});

app.use(flash());

// config passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash ? req.flash("success") : [];
  res.locals.error = req.flash ? req.flash("error") : [];
  res.locals.currUser = req.user || null;
  next();
});

// router use
app.get("/", (req, res) => {
  res.redirect("/listings");
});
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// error handling
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size must be under 5MB";
    }
  }
  res.locals.success = res.locals.success || [];
  res.locals.error = res.locals.error || [];
  res.locals.currUser = res.locals.currUser || null;
  res.status(statusCode).render("error.ejs", {
    err,
    message,
    success: res.locals.success,
    error: res.locals.error,
    currUser: res.locals.currUser,
  });
});

if (!process.env.VERCEL) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
