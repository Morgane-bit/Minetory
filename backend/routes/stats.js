// routes/stats.js
const express = require('express');
const router = express.Router();
const Maison = require('../models/Maison');
const Message = require('../models/Message');

// Statistiques principales
router.get('/', async (req, res) => {
  try {
    const nbMaisons = await Maison.countDocuments();
    let nbMessages = await Message.countDocuments();

    // Si la collection Message est vide, on force 0
    if (!nbMessages) nbMessages = 0;

    // Stats par localisation
    const statsLocalisation = await Maison.aggregate([
      { $group: { _id: "$localisation", total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Stats par type de maison
    const statsType = await Maison.aggregate([
      { $group: { _id: "$type", total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      maisons: nbMaisons,
      messages: nbMessages,
      parLocalisation: statsLocalisation,
      parType: statsType
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
