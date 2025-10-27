// backend/routes/events.js
const express = require("express");
const eventsController = require("../controllers/events");
const { userExtractor, authorize } = require("../utils/middleware");
const createUpload = require("../utils/multerConfig");

const upload = createUpload("events"); // Définit le dossier 'uploads/events' pour les images
const router = express.Router();

// --- Routes pour tous les utilisateurs authentifiés ---
// GET /api/events/
router.get("/", userExtractor, eventsController.getAllEvents);
// GET /api/events/:id
router.get("/:id", userExtractor, eventsController.getEventById);
// POST /api/events/:id/register (Inscription d'un utilisateur)
router.post("/:id/register", userExtractor, eventsController.registerToEvent);

// --- Routes Protégées (Organisateurs et Admins) ---
// POST /api/events/ (Création)
router.post(
  "/",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  upload.single("image"), // Le champ du formulaire doit s'appeler 'image'
  eventsController.createEvent
);

// PUT /api/events/:id (Mise à jour)
router.put(
  "/:id",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  upload.single("image"),
  eventsController.updateEvent
);

// DELETE /api/events/:id (Suppression)
router.delete(
  "/:id",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  eventsController.deleteEvent
);

// POST /api/events/:id/participants (Ajouter un participant manuellement)
router.post(
  "/:id/participants",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  eventsController.addParticipant
);

// DELETE /api/events/:id/participants/:participantId (Retirer un participant)
router.delete(
  "/:id/participants/:participantId",
  userExtractor,
  authorize(["administrateur", "Organisateur"]),
  eventsController.removeParticipant
);

// POST /api/events/validate-qr (Valider un QR Code) - Route renommée pour clarté
router.post(
  "/validate-qr", // Route plus générale, l'événement est dans le body
  userExtractor,
  authorize(["Organisateur", "administrateur"]),
  eventsController.validateQRCodeWithEventName
);

// GET /api/events/organizer/me (Voir les événements créés par l'organisateur connecté)
router.get(
  "/organizer/me",
  userExtractor,
  authorize(["Organisateur"]), // Seul un organisateur peut voir ses propres événements
  eventsController.getEventsByOrganizer
);

module.exports = router;
