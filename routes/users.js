const express = require("express");
const router = express.Router();

const {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getMe,
  updateMe,
  uploadUserAvatar,
  getMyEvents,
} = require("../controllers/userController");

const { userExtractor, authorize } = require("../utils/middleware");
const createUpload = require("../utils/multerConfig");
const upload = createUpload("users");

router.get("/me", userExtractor, getMe);

// GET /api/users/me
router.get("/me", userExtractor, getMe);

// PUT /api/users/me
router.put("/me", userExtractor, updateMe);

// GET /api/users/me/events
router.get("/me/events", userExtractor, getMyEvents);

// POST /api/users/avatar (gère 'upload.single' ici)
router.post(
  "/avatar",
  userExtractor,
  upload.single("avatar"),
  uploadUserAvatar
);

// --- Routes pour l'administration (général) ---

// GET /api/users/
router.get(
  "/",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  getAllUsers
);

// GET /api/users/:id
router.get(
  "/:id",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  getUserById
);

// POST /api/users/
router.post(
  "/",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  upload.single("image"),
  createUser
);

// PUT /api/users/:id
router.put(
  "/:id",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  upload.single("image"),
  updateUser
);

// DELETE /api/users/:id
router.delete("/:id", userExtractor, authorize(["administrateur"]), deleteUser);

module.exports = router;
