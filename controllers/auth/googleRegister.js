const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const config = require("../../utils/config");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleRegister = async (req, res, next) => {
  try {
    const { token: googleToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Crée l'utilisateur s'il n'existe pas
      user = await User.create({
        nom: name,
        email,
        passwordHash: "",
        role: "Participant",
        sexe: "",
        profession: "",
        avatarUrl: picture || "/avatars/default.png",
        provider: "google",
      });
    }

    // Génère JWT backend
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: "72h" }
    );

    res.status(200).json({ user, token: jwtToken });
  } catch (err) {
    next(err);
  }
};

module.exports = { googleRegister };
