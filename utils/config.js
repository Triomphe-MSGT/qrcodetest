require("dotenv").config();

const PORT = process.env.PORT || 3001;

const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("⚠️ Attention : JWT_SECRET non défini !");
}

module.exports = {
  MONGODB_URI,
  PORT,
  JWT_SECRET,
};
