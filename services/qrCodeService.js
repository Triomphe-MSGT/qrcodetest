const qrcode = require("qrcode");
const crypto = require("crypto");

// Génère un token unique pour l'inscription
const generateUniqueToken = () => {
  return crypto.randomBytes(32).toString("hex"); // 64 caractères hexadécimaux
};

// Génère une image QR code à partir d'un payload JSON
const generateQRCodeImage = async (payload) => {
  try {
    const dataUrl = await qrcode.toDataURL(payload);
    return dataUrl;
  } catch (err) {
    console.error("Erreur lors de la génération du QR code:", err);
    throw new Error("Impossible de générer le QR code.");
  }
};

const generateQRCodeForInscription = async (
  participantFormData,
  event,
  user
) => {
  try {
    const token = generateUniqueToken();

    // Contenu encodé dans le QR code
    const payload = JSON.stringify({
      token,
      eventId: event._id,
      userId: user._id,
      eventName: event.name,
      participant: {
        ...participantFormData, // nom, email, profession, don
      },
    });

    const qrCodeImage = await generateQRCodeImage(payload);

    return { qrCodeImage, token };
  } catch (err) {
    console.error(
      "Erreur lors de la génération du QR code pour l'inscription :",
      err
    );
    throw new Error("Impossible de générer le QR code.");
  }
};

module.exports = {
  generateUniqueToken,
  generateQRCodeImage,
  generateQRCodeForInscription,
};
