const mongoose = require("mongoose");

const inscriptionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    qrCodeImage: {
      type: String,
      required: true,
    },

    qrCodeToken: {
      type: String,
      required: true,
      unique: true,
    },
    // Pour empêcher une double utilisation
    isValidated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inscription", inscriptionSchema);
