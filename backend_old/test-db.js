const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/ludo_test")
  .then(() => {
    console.log("✅ LOCAL DB WORKING");
  })
  .catch(err => {
    console.log("❌ ERROR:", err);
  });