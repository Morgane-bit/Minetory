// routes/maisons.js
const express = require('express');
const router = express.Router();
const Maison = require('../models/Maison');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Configuration multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// --------------------
// GET toutes les maisons (publique, filtrable)
// --------------------
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.localisation) {
      query.localisation = { $regex: req.query.localisation, $options: 'i' };
    }
    if (req.query.type) {
      query.type = req.query.type;
    }

    let maisons = await Maison.find(query)
      .populate('proprietaire', 'nom email')
      .lean(); // convert to plain JS objects

    // Ensure images array exists
    maisons = maisons.map(m => ({ ...m, images: m.images || [] }));

    res.json(maisons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET toutes les maisons du propriétaire connecté
// --------------------
router.get('/mes-maisons', auth, async (req, res) => {
  try {
    let maisons = await Maison.find({ proprietaire: req.proprietaire._id }).lean();
    maisons = maisons.map(m => ({ ...m, images: m.images || [] }));
    res.json(maisons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET détails d'une maison (publique)
// --------------------
router.get('/:id', async (req, res) => {
  try {
    let maison = await Maison.findById(req.params.id)
      .populate('proprietaire', 'nom email')
      .lean();
    if (!maison) return res.status(404).json({ error: 'Maison introuvable' });

    maison.images = maison.images || [];
    res.json(maison);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// POST créer une maison (propriétaire seulement)
// --------------------
router.post('/', auth, upload.array('media'), async (req, res) => {
  try {
    const { titre, localisation, type, prix, description } = req.body;

    if (!titre || !localisation || !type || !prix) {
      return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
    }

    const prixNumber = parseFloat(prix);
    if (isNaN(prixNumber)) return res.status(400).json({ error: "Prix invalide." });

    const images = req.files ? req.files.map(file => file.filename) : [];

    const maison = new Maison({
      titre,
      localisation,
      type,
      prix: prixNumber,
      description: description || '',
      proprietaire: req.proprietaire._id,
      images
    });

    await maison.save();
    res.json({ success: true, maison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// PUT modifier une maison (propriétaire seulement)
// --------------------
router.put('/:id', auth, upload.array('media'), async (req, res) => {
  try {
    const maison = await Maison.findById(req.params.id);
    if (!maison) return res.status(404).json({ error: 'Maison introuvable' });

    if (maison.proprietaire.toString() !== req.proprietaire._id.toString()) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const { titre, localisation, type, prix, description, images: imagesSupprimees } = req.body;

    maison.titre = titre || maison.titre;
    maison.localisation = localisation || maison.localisation;
    maison.type = type || maison.type;
    maison.prix = prix ? parseFloat(prix) : maison.prix;
    maison.description = description || maison.description;

    // Supprimer les images demandées
    if (imagesSupprimees) {
      const imagesASupprimer = Array.isArray(imagesSupprimees) ? imagesSupprimees : [imagesSupprimees];
      maison.images = maison.images.filter(img => !imagesASupprimer.includes(img));
      imagesASupprimer.forEach(img => {
        const filePath = path.join('uploads', img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    // Ajouter les nouvelles images uploadées
    if (req.files.length > 0) {
      maison.images.push(...req.files.map(f => f.filename));
    }

    await maison.save();
    res.json({ success: true, message: 'Maison modifiée !', maison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// DELETE maison (propriétaire seulement)
// --------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const maison = await Maison.findById(req.params.id);
    if (!maison) return res.status(404).json({ error: "Maison non trouvée" });

    if (maison.proprietaire.toString() !== req.proprietaire._id.toString()) {
      return res.status(403).json({ error: "Action non autorisée." });
    }

    // Supprimer les images du serveur
    maison.images.forEach(img => {
      const filePath = path.join('uploads', img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Maison.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Maison supprimée avec succès" });
  } catch (error) {
    console.error("Erreur serveur suppression :", error);
    res.status(500).json({ error: "Erreur lors de la suppression de la maison" });
  }
});

module.exports = router;
