# 🌍 Wanderlust - Full Stack Travel & Stay Booking Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo%20on%20Vercel-black?style=for-the-badge&logo=vercel)](https://wanderlust-travel-ruddy.vercel.app/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

A full-stack web application inspired by Airbnb, built with the **MVC (Model-View-Controller)** pattern using **Node.js, Express.js, MongoDB Atlas, and EJS**. Wanderlust enables users to explore, create, manage vacation rentals, post reviews, and view locations dynamically with interactive maps.

---

## 🚀 Live Demo

Experience the live application here:  
👉 **[https://wanderlust-travel-ruddy.vercel.app/](https://wanderlust-travel-ruddy.vercel.app/)**

---

## ✨ Features

### 🏡 Listings Management (CRUD)
- **Explore Accommodations**: Browse all listed vacation stays with pricing, photos, and destinations.
- **Add New Listing**: Registered users can publish their property with image upload and location details.
- **Edit & Delete**: Full control over listing details, pricing, descriptions, and pictures (restricted to the property owner).
- **Price with Taxes Toggle**: Interactive switch to dynamically display prices with/without 18% GST.

### 📍 Interactive Maps & Geocoding
- **Dynamic Geocoding**: Automatically converts user-entered location and country into exact geographical coordinates (`[longitude, latitude]`).
- **Interactive Map Rendering**: Integrated **Mapbox GL JS** with seamless fallback to **OpenStreetMap (Leaflet)**.
- **Custom Markers & Popups**: Displays the exact location pin with interactive popup cards on the listing details page.

### 🔐 Authentication & Authorization
- **User Signup & Login**: Secure password hashing with salt using **Passport.js**.
- **Role-based Permissions**:
  - Only logged-in users can create listings and submit reviews.
  - Only the listing owner can edit or delete their listing.
  - Only review authors can delete their own reviews.
- **Session Management**: Persistent user sessions stored in MongoDB Atlas via `connect-mongo`.
- **Redirect Memory**: Remembers the page the user intended to visit before logging in.

### ⭐ Reviews & Ratings System
- Users can leave ratings (1 to 5 stars) using an interactive star-rating system.
- Detailed written feedback for each stay.
- Dynamic review deletion with instant feedback.

### 📷 Cloud Media Storage
- Fast, resilient image uploading using **Cloudinary API**.
- Optimized image transformations and secure CDN asset delivery.

### 🎨 Responsive & Modern UI
- Clean UI crafted with **Bootstrap 5**, custom CSS styling, and **FontAwesome** icons.
- Flash messages (`connect-flash`) for immediate user feedback on actions (login, error, update, delete).
- Mobile-first, fully responsive design for desktops, tablets, and smartphones.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | EJS (Embedded JavaScript), EJS-Mate, Bootstrap 5, FontAwesome, CSS3, HTML5 |
| **Backend** | Node.js, Express.js (MVC Pattern) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | Passport.js, Passport-Local, Express-Session, Connect-Mongo |
| **Cloud Storage** | Cloudinary API |
| **Maps & Geo** | Mapbox GL JS, OpenStreetMap Nominatim, Leaflet.js |
| **Validation** | Joi Schema Validation |
| **Deployment** | Vercel (Serverless Functions) |

---

## 📂 Project Structure

```text
wanderlust-travel/
├── api/
│   └── index.js              # Vercel serverless entry point
├── controllers/              # Business logic (MVC Controllers)
│   ├── listing.js            # Listing CRUD & Geocoding logic
│   ├── review.js             # Review handling logic
│   └── user.js               # Auth & user management
├── models/                   # Mongoose Database Schemas (MVC Models)
│   ├── listing.js            # Listing model with GeoJSON geometry
│   ├── review.js             # Review model
│   └── user.js               # User authentication model
├── routes/                   # Express Routers
│   ├── listing.js            # Listing endpoints
│   ├── review.js             # Review endpoints
│   └── user.js               # Auth endpoints (signup, login, logout)
├── views/                    # EJS Templates (MVC Views)
│   ├── layouts/
│   │   └── boilerplate.ejs   # Main HTML wrapper layout
│   ├── includes/             # Partials (navbar, footer, flash)
│   ├── listings/             # Listing views (index, show, new, edit)
│   └── users/                # Auth views (login, signup)
├── public/                   # Static files (CSS, client-side JS, images)
│   ├── css/
│   └── js/
│       ├── map.js            # Dual Mapbox/Leaflet interactive map script
│       └── script.js         # Client-side form validation
├── utils/                    # Helper utilities & geocoder
│   ├── ExpressError.js       # Custom error class
│   ├── wrapAsync.js          # Async error wrapper
│   └── geocode.js            # Dynamic Mapbox & Nominatim geocoder
├── init/                     # Database seed data
├── middlewares.js            # Auth & validation middlewares
├── cloudConfig.js            # Cloudinary storage configuration
├── schema.js                 # Joi validation schemas
├── app.js                    # Express application entry & middleware chain
├── vercel.json               # Vercel deployment configuration
└── package.json
```

---

## ⚙️ Local Development Setup

Follow these steps to run the project locally on your machine:

### 1. Clone the repository
```bash
git clone https://github.com/ary12ansaini-cyber/wanderlust-travel.git
cd wanderlust-travel
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```bash
touch .env
```
Add the following variables:
```env
ATLASDB_URL=your_mongodb_atlas_connection_string
SECRET=your_super_secret_session_key
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
MAP_TOKEN=your_mapbox_token_or_leave_blank_for_openstreetmap
```

### 4. (Optional) Initialize Sample Database Data
```bash
node init/index.js
```

### 5. Start the Application
```bash
# Run with Node
npm start

# Or run with Nodemon for development
npm run dev
```

Visit the application in your browser at:
```text
http://localhost:8080/
```

---

## 🔒 Security & Best Practices

- **Password Hashing**: Utilizes PBKDF2 with unique salts via `passport-local-mongoose`.
- **Environment Protection**: Sensitive API keys and credentials are shielded through `.env` and `.gitignore`.
- **Sanitized Serverless Routing**: Clean URL normalization and Edge middleware segregation for Vercel deployment.
- **Fail-Safe Geocoding**: Dual-engine geocoding ensures coordinates are resolved even without an active Mapbox token.

---

## 👤 Author

**Aryan Saini**
- GitHub: [@ary12ansaini-cyber](https://github.com/ary12ansaini-cyber)
- Project: [Wanderlust Travel](https://github.com/ary12ansaini-cyber/wanderlust-travel)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
