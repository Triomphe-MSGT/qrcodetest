const express = require("express");
const {
  getAllCategories,
  getCategoryById,
  getCategoryByName, // On ajoute cette fonction
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories");

const { userExtractor, authorize } = require("../utils/middleware");

const router = express.Router();

// --- Routes pour tous les utilisateurs connectés ---
router.get("/", userExtractor, getAllCategories);
router.get("/id/:id", userExtractor, getCategoryById);

router.get("/name/:name", userExtractor, getCategoryByName);

// --- Routes pour Administrateur seulement ---
router.post("/", userExtractor, authorize("administrateur"), createCategory);
router.put("/:id", userExtractor, authorize("administrateur"), updateCategory);
router.delete(
  "/:id",
  userExtractor,
  authorize("administrateur"),
  deleteCategory
);

module.exports = router;
