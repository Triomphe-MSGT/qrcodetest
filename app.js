const express = require("express");
require("express-async-errors");
const app = express();
const cors = require("cors");
const path = require("path"); // Import du module 'path'
const mongoose = require("mongoose");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");

// Import des routeurs
const usersRouter = require("./routes/users");
const eventsRouter = require("./routes/events");
const categoriesRouter = require("./routes/categories");
const dashboardRouter = require("./routes/dashboard");
const authRouter = require("./routes/auth"); // Import corrigé

// --- Connexion Mongoose ---
logger.info("connecting to", config.MONGODB_URI);
mongoose.set("strictQuery", false);
mongoose
  .connect(config.MONGODB_URI)
  .then(() => logger.info("connected to MongoDB"))
  .catch((err) => logger.error("error connecting to MongoDB:", err.message));

// --- Middlewares de base ---
app.use(cors());
app.use(express.static("dist"));
app.use(express.json());

// --- Configuration pour servir le Frontend et le Backend ensemble ---

// 1. Servir les fichiers statiques de l'API (ex: images uploadées)
// Doit être avant les routes API si /uploads n'est pas préfixé par /api
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 2. Définir toutes vos routes API
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// Les middlewares de fin (gestion des erreurs)
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
