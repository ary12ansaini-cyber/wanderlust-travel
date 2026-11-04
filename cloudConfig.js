const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

let storage;

const isCloudinaryConfigured =
  process.env.CLOUD_NAME &&
  process.env.CLOUD_API_KEY &&
  process.env.CLOUD_API_SECRET;

if (isCloudinaryConfigured) {
  let CloudinaryStorageClass;
  try {
    const pkg = require("multer-storage-cloudinary");
    CloudinaryStorageClass = pkg.CloudinaryStorage || pkg;
  } catch (err) {
    // If multer-storage-cloudinary is not installed, use custom stream storage
    CloudinaryStorageClass = null;
  }

  if (CloudinaryStorageClass) {
    try {
      storage = new CloudinaryStorageClass({
        cloudinary: cloudinary,
        params: {
          folder: "wanderlust_DEV",
          allowed_formats: ["png", "jpg", "jpeg", "webp"],
        },
      });
    } catch (e) {
      storage = null;
    }
  }

  if (!storage) {
    // Native Multer Storage Engine uploading directly via Cloudinary SDK
    function CloudinaryStreamStorage() {}

    CloudinaryStreamStorage.prototype._handleFile = function (req, file, cb) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "wanderlust_DEV",
          resource_type: "auto",
        },
        (err, result) => {
          if (err) return cb(err);
          cb(null, {
            path: result.secure_url,
            filename: result.public_id,
            url: result.secure_url,
          });
        }
      );

      file.stream.pipe(uploadStream);
    };

    CloudinaryStreamStorage.prototype._removeFile = function (req, file, cb) {
      if (file.filename) {
        cloudinary.uploader.destroy(file.filename, cb);
      } else {
        cb(null);
      }
    };

    storage = new CloudinaryStreamStorage();
  }
} else {
  // Fallback to local disk storage when Cloudinary credentials are not set
  const uploadDir = path.join(__dirname, "public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    },
  });
}

module.exports = {
  cloudinary,
  storage,
};
