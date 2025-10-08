// routes/proprietaire.js
// routes/proprietaire.js
const express = require('express');
const router = express.Router();
const Proprietaire = require('../models/Proprietaire');
const Maison = require('../models/Maison');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- Inscription ---
router.post('/register', async (req, res) => {
  let { nom, email, telephone, password } = req.body;

  // Normalisation
  email = email.toLowerCase().trim();
  nom = nom.trim();
  telephone = telephone ? telephone.trim() : '';

  if (!nom || !email || !telephone || !password) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }

  try {
    // Vérifier si l'email existe déjà
    const existing = await Proprietaire.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

    // ⚠️ NE PAS hasher ici → le pre("save") du modèle s’en charge
    const proprietaire = new Proprietaire({ nom, email, telephone, password });
    await proprietaire.save();

    // Générer un token dès l'inscription pour connecter directement
    const token = jwt.sign({ id: proprietaire._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      message: 'Compte créé et connecté !',
      token,
      proprietaire: {
        id: proprietaire._id,
        nom: proprietaire.nom,
        email: proprietaire.email,
        telephone: proprietaire.telephone
      }
    });
  } catch (err) {
    console.error('Erreur inscription :', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Connexion ---
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase(); // normaliser
  try {
    const proprietaire = await Proprietaire.findOne({ email });
    if (!proprietaire) {
      console.log('Utilisateur non trouvé');
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, proprietaire.password);
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: proprietaire._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      token,
      proprietaire: {
        id: proprietaire._id,
        nom: proprietaire.nom,
        email: proprietaire.email,
        telephone: proprietaire.telephone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// --- Infos du propriétaire connecté ---
router.get('/me', auth, async (req, res) => {
  const { nom, email, telephone } = req.proprietaire;
  res.json({ nom, email, telephone });
});

// --- Modifier profil ---
router.put('/update', auth, async (req, res) => {
  const { nom, email, telephone, password } = req.body;
  try {
    if (email && email !== req.proprietaire.email) {
      const emailExist = await Proprietaire.findOne({ email });
      if (emailExist) return res.status(400).json({ error: 'Email déjà utilisé par un autre compte' });
      req.proprietaire.email = email;
    }

    if (nom) req.proprietaire.nom = nom;
    if (telephone) req.proprietaire.telephone = telephone;
    if (password) req.proprietaire.password = password; // ⚠️ le pre("save") fera le hash

    await req.proprietaire.save();

    res.json({
      success: true,
      message: 'Profil mis à jour',
      proprietaire: {
        nom: req.proprietaire.nom,
        email: req.proprietaire.email,
        telephone: req.proprietaire.telephone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Supprimer compte ---
router.delete('/delete', auth, async (req, res) => {
  try {
    await Maison.deleteMany({ proprietaire: req.proprietaire._id });
    await req.proprietaire.deleteOne();
    res.json({ success: true, message: 'Compte et maisons associées supprimés' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
