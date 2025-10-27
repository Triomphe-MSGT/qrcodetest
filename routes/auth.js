const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleLogin,
} = require("../controllers/auth/authController");
const createUpload = require("../utils/multerConfig");

const upload = createUpload("users");

router.post("/register", upload.single("image"), register);

router.post("/login", login);

router.post("/google", googleLogin);

module.exports = router;
