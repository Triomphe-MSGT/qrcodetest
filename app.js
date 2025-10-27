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
app.use(express.json());

// --- Configuration pour servir le Frontend et le Backend ensemble ---

// 1. Servir les fichiers statiques de l'API (ex: images uploadées)
// Doit être avant les routes API si /uploads n'est pas préfixé par /api
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 2. Définir toutes vos routes API
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/auth", authRouter); // Utilisation de la variable importée
app.use("/api/dashboard", dashboardRouter);

// 3. Servir les fichiers statiques du build React (Vite)
// (Vient APRÈS les routes API pour que /api/... ait la priorité)
app.use(express.static(path.join(__dirname, "dist")));

// 4. Route "catch-all" pour le routage côté client (React Router)
// Cette route doit être la DERNIÈRE route GET.
// Elle renvoie votre index.html pour n'importe quelle autre requête
// (ex: /home, /profile, /events/123) pour que React Router prenne le relais.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// --- FIN de la configuration de déploiement ---

// Les middlewares de fin (gestion des erreurs)
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
