const jwt = require('jsonwebtoken');
const Proprietaire = require('../models/Proprietaire');
require('dotenv').config();

module.exports = async function(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: "Accès refusé, token manquant" });
    }

    // Vérifie le format "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: "Format de token invalide" });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const proprietaire = await Proprietaire.findById(decoded.id);
    if (!proprietaire) {
      return res.status(401).json({ error: "Propriétaire non trouvé" });
    }

    req.proprietaire = proprietaire; // Attache le propriétaire à la requête
    next();
  } catch (err) {
    console.error("Erreur middleware auth:", err.message);
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};
