const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const bcrypt = require("bcrypt");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body; // JWT Google envoyé depuis le front
    if (!token) {
      return res.status(400).json({ error: "Token Google requis" });
    }

    // Vérifie et décode le token Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Email non récupéré depuis Google" });
    }

    // Cherche si l'utilisateur existe déjà
    let user = await User.findOne({ email });

    if (!user) {
      // Crée un utilisateur avec des valeurs par défaut pour les champs requis
      const defaultPassword = "GOOGLE_LOGIN_TEMP";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      user = new User({
        nom: name || "Utilisateur Google",
        email,
        passwordHash,
        role: "Participant", // rôle par défaut
        sexe: "Homme",
        profession: "",
        avatarUrl: picture || "",
      });

      await user.save();
    }

    // Génération du JWT pour ton application
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "72h" }
    );

    res.status(200).json({
      token: jwtToken,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        sexe: user.sexe,
        profession: user.profession,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { googleLogin };
