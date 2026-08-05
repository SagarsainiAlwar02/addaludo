const bcrypt = require("bcryptjs");

const password = "Mohit@9250"; // 👈 new password yaha

const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log("Original Password:", password);
  console.log("Hashed Password:", hash);
});