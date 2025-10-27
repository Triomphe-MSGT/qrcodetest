// backend/controllers/events.js
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Event = require("../models/event");
const User = require("../models/user");
const Category = require("../models/category");
const Inscription = require("../models/inscription");
const qrCodeService = require("../services/qrCodeService"); // ✅ Vérifiez le chemin

// --- Obtenir tous les événements ---
const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate("organizer", "nom email")
      .populate("category", "name emoji")
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

// --- Obtenir un événement par ID ---
const getEventById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID d'événement invalide" });
    }
    const event = await Event.findById(req.params.id)
      .populate("organizer", "nom email")
      .populate("category", "name emoji")
      .populate("participants", "nom email role sexe profession"); // Peuple avec sexe/profession

    if (!event) return res.status(404).json({ error: "Événement non trouvé" });
    res.json(event);
  } catch (error) {
    next(error);
  }
};

// --- Créer un nouvel événement ---
const createEvent = async (req, res, next) => {
  try {
    const { body, user } = req; // user vient de userExtractor { id, role }

    const category = await Category.findById(body.category);
    if (!category) return res.status(400).json({ error: "Catégorie invalide" });

    const newEvent = new Event({
      ...body,
      organizer: user.id,
      imageUrl: req.file
        ? path.join("uploads", "events", req.file.filename).replace(/\\/g, "/")
        : null,
    });

    const savedEvent = await newEvent.save();
    category.events.push(savedEvent._id);
    await category.save();

    res.status(201).json(savedEvent);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// --- Mettre à jour un événement ---
const updateEvent = async (req, res, next) => {
  try {
    const { body, user } = req;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "ID d'événement invalide" });
    }

    const eventToUpdate = await Event.findById(eventId);
    if (!eventToUpdate)
      return res.status(404).json({ error: "Événement non trouvé" });

    const isOwner = eventToUpdate.organizer.toString() === user.id;
    const isAdmin = user.role === "administrateur";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Action non autorisée." });
    }

    // Gestion de la catégorie
    if (body.category && body.category !== eventToUpdate.category.toString()) {
      await Category.findByIdAndUpdate(eventToUpdate.category, {
        $pull: { events: eventId },
      });
      await Category.findByIdAndUpdate(body.category, {
        $push: { events: eventId },
      });
    }

    // Gestion de l'image
    if (req.file) {
      if (
        eventToUpdate.imageUrl &&
        !eventToUpdate.imageUrl.startsWith("http") &&
        fs.existsSync(path.resolve(__dirname, "..", eventToUpdate.imageUrl))
      ) {
        try {
          fs.unlinkSync(path.resolve(__dirname, "..", eventToUpdate.imageUrl));
        } catch (e) {
          console.error("Erreur suppression ancienne image:", e);
        }
      }
      body.imageUrl = path
        .join("uploads", "events", req.file.filename)
        .replace(/\\/g, "/");
    } else if (body.image === null || body.image === "") {
      if (
        eventToUpdate.imageUrl &&
        !eventToUpdate.imageUrl.startsWith("http") &&
        fs.existsSync(path.resolve(__dirname, "..", eventToUpdate.imageUrl))
      ) {
        try {
          fs.unlinkSync(path.resolve(__dirname, "..", eventToUpdate.imageUrl));
        } catch (e) {
          console.error("Erreur suppression image:", e);
        }
      }
      body.imageUrl = null;
    } else {
      delete body.imageUrl;
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, body, {
      new: true,
      runValidators: true,
    })
      .populate("organizer", "nom email")
      .populate("category", "name emoji");

    if (!updatedEvent)
      return res
        .status(404)
        .json({ error: "Événement non trouvé après mise à jour." });
    res.json(updatedEvent);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Erreur lors de la mise à jour event:", error);
    next(error);
  }
};

// --- Supprimer un événement ---
const deleteEvent = async (req, res, next) => {
  try {
    const { user } = req;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "ID d'événement invalide" });
    }
    const eventToDelete = await Event.findById(eventId);
    if (!eventToDelete)
      return res.status(404).json({ error: "Événement non trouvé" });

    const isOwner = eventToDelete.organizer.toString() === user.id;
    const isAdmin = user.role === "administrateur";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Action non autorisée." });
    }

    // Supprime l'image
    if (
      eventToDelete.imageUrl &&
      !eventToDelete.imageUrl.startsWith("http") &&
      fs.existsSync(path.resolve(__dirname, "..", eventToDelete.imageUrl))
    ) {
      try {
        fs.unlinkSync(path.resolve(__dirname, "..", eventToDelete.imageUrl));
      } catch (e) {
        console.error("Erreur suppression image:", e);
      }
    }

    // Supprime les inscriptions, retire l'événement des participants et de la catégorie
    await Inscription.deleteMany({ event: eventId });
    await User.updateMany(
      { _id: { $in: eventToDelete.participants } },
      { $pull: { participatedEvents: eventId } }
    );
    await Category.findByIdAndUpdate(eventToDelete.category, {
      $pull: { events: eventId },
    });
    await Event.findByIdAndDelete(eventId);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// --- Inscription d'un participant ---
const registerToEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "ID d'événement invalide" });
    }

    const participantUser = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ error: "Événement non trouvé" });
    if (!participantUser)
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    if (event.participants.includes(participantUser._id))
      return res.status(400).json({ error: "Vous êtes déjà inscrit" });

    const { nom, email, profession } = req.body;

    event.participants.push(participantUser._id);
    participantUser.participatedEvents.push(event._id);
    await event.save();
    await participantUser.save();

    if (event.qrOption) {
      const qrFormData = {
        nom: nom || participantUser.nom,
        email: email || participantUser.email,
        profession: profession || participantUser.profession,
      };

      const { qrCodeImage, token } =
        await qrCodeService.generateQRCodeForInscription(
          qrFormData,
          event,
          participantUser
        );
      const inscription = new Inscription({
        event: event._id,
        participant: participantUser._id,
        qrCodeToken: token,
        qrCodeImage: qrCodeImage,
      });
      await inscription.save();

      return res.status(201).json({
        message: "Inscription réussie avec QR code",
        qrCode: qrCodeImage,
      });
    }

    res.status(201).json({ message: "Inscription réussie" });
  } catch (error) {
    next(error);
  }
};

// --- Désinscription d'un participant ---
const unregisterFromEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "ID d'événement invalide" });
    }

    await Event.findByIdAndUpdate(eventId, { $pull: { participants: userId } });
    await User.findByIdAndUpdate(userId, {
      $pull: { participatedEvents: eventId },
    });
    await Inscription.findOneAndDelete({ event: eventId, participant: userId });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// --- Validation QR code ---
const validateQRCodeWithEventName = async (req, res, next) => {
  try {
    const { qrCodeToken, eventName } = req.body;
    const userValidating = await User.findById(req.user.id);

    if (!userValidating)
      return res
        .status(401)
        .json({ error: "Utilisateur validateur non trouvé." });

    const inscription = await Inscription.findOne({ qrCodeToken })
      .populate("participant", "nom email profession")
      .populate("event", "name organizer");

    if (!inscription)
      return res
        .status(404)
        .json({ error: "QR Code invalide ou inscription non trouvée." });

    const { participant, event } = inscription;

    if (event.name !== eventName)
      return res
        .status(400)
        .json({ error: "Ce QR code est pour un autre événement." });

    const isEventOwner =
      event.organizer.toString() === userValidating._id.toString();
    const isAdmin = userValidating.role === "administrateur";
    if (!isEventOwner && !isAdmin)
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à valider pour cet événement.",
      });

    if (inscription.isValidated)
      return res.status(409).json({ error: "Ce QR code a déjà été utilisé." });

    inscription.isValidated = true;
    inscription.validatedBy = userValidating._id;
    inscription.validatedAt = new Date();
    await inscription.save();

    res.json({
      message: "QR code validé avec succès",
      participant: {
        id: participant._id,
        nom: participant.nom,
        email: participant.email,
        profession: participant.profession,
      },
      event: { id: event._id, name: event.name },
    });
  } catch (error) {
    next(error);
  }
};

// --- Ajouter un participant (par Admin/Organisateur) ---
const addParticipant = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    const eventId = req.params.id;
    const user = req.user;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(participantId)
    ) {
      return res.status(400).json({ error: "ID invalide." });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Événement non trouvé" });

    const isOwner = event.organizer.toString() === user.id;
    const isAdmin = user.role === "administrateur";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: "Action non autorisée." });

    const participant = await User.findById(participantId);
    if (!participant)
      return res.status(404).json({ error: "Utilisateur non trouvé" });

    if (event.participants.includes(participant._id)) {
      return res
        .status(400)
        .json({ error: "Cet utilisateur est déjà inscrit." });
    }

    event.participants.push(participant._id);
    participant.participatedEvents.push(event._id);
    await event.save();
    await participant.save();

    if (event.qrOption) {
      const { qrCodeImage, token } =
        await qrCodeService.generateQRCodeForInscription(
          {
            nom: participant.nom,
            email: participant.email,
            profession: participant.profession,
          },
          event,
          participant
        );
      const inscription = new Inscription({
        event: event._id,
        participant: participant._id,
        qrCodeToken: token,
        qrCodeImage: qrCodeImage,
      });
      await inscription.save();
    }

    const populatedEvent = await Event.findById(eventId)
      .populate("participants", "nom email role sexe profession") // Peuple avec les nouveaux champs
      .populate("organizer", "nom email")
      .populate("category", "name emoji"); // Ne pas oublier la catégorie

    res.json(populatedEvent);
  } catch (error) {
    next(error);
  }
};

// --- Supprimer un participant (par Admin/Organisateur) ---
const removeParticipant = async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const eventId = req.params.id;
    const user = req.user;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(participantId)
    ) {
      return res.status(400).json({ error: "ID invalide." });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Événement non trouvé" });

    const isOwner = event.organizer.toString() === user.id;
    const isAdmin = user.role === "administrateur";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: "Action non autorisée." });

    await Event.findByIdAndUpdate(eventId, {
      $pull: { participants: participantId },
    });
    await User.findByIdAndUpdate(participantId, {
      $pull: { participatedEvents: eventId },
    });
    await Inscription.findOneAndDelete({
      event: eventId,
      participant: participantId,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// --- Obtenir les événements créés par l'organisateur connecté ---
const getEventsByOrganizer = async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({ organizer: organizerId })
      .populate("category", "name emoji")
      // ✅ C'EST CETTE LIGNE QUI AJOUTE SEXE ET PROFESSION
      .populate("participants", "nom email role sexe profession")
      .sort({ startDate: -1 });

    res.json(events);
  } catch (error) {
    console.error("❌ Erreur getEventsByOrganizer:", error);
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerToEvent,
  unregisterFromEvent,
  validateQRCodeWithEventName,
  addParticipant,
  removeParticipant,
  getEventsByOrganizer,
};
