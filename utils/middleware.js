const jwt = require("jsonwebtoken");
const User = require("../models/user");

const logger = {
  info: (...params) => console.log("[INFO]", ...params),
  error: (...params) => console.error("[ERROR]", ...params),
};

const userExtractor = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error("Erreur lors de la vérification du token :", err.message);

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Le token a expiré, veuillez vous reconnecter" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token invalide ou corrompu" });
    }

    return res.status(500).json({ error: "Erreur d'authentification" });
  }
};

const authorize = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.error(`Accès refusé à ${req.user.email}, rôle : ${req.user.role}`);
      return res
        .status(403)
        .json({ error: "Accès interdit. Droits insuffisants." });
    }

    next();
  };
};

const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: "Endpoint inconnu" });
};

const errorHandler = (err, req, res, next) => {
  logger.error("Erreur attrapée :", err.message);

  if (err.name === "CastError") {
    return res.status(400).json({ error: "ID mal formaté" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: "Cet email est déjà utilisé" });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token invalide" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expiré" });
  }

  return res.status(500).json({ error: "Erreur serveur interne" });
};

module.exports = {
  userExtractor,
  authorize,
  unknownEndpoint,
  errorHandler,
};
