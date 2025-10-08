// routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Maison = require('../models/Maison');
const auth = require('../middleware/auth');

// --- Créer un message (client -> propriétaire)
router.post('/', async (req, res) => {
  try {
    const { nomClient, email, telephone, message, maisonId } = req.body;
    if (!nomClient || !email || !telephone || !message || !maisonId)
      return res.status(400).json({ success: false, error: "Champs obligatoires manquants" });

    const maison = await Maison.findById(maisonId);
    if (!maison) return res.status(404).json({ success: false, error: "Maison introuvable" });

    const msg = new Message({
      maison: maisonId,
      nomClient,
      email,
      telephone,
      message,
      from: 'client'
    });

    await msg.save();
    res.json({ success: true, message: "Message envoyé au propriétaire !" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Récupérer tous les messages pour un propriétaire
router.get('/', auth, async (req, res) => {
  try {
    const maisons = await Maison.find({ proprietaire: req.proprietaire._id });
    const maisonIds = maisons.map(m => m._id);

    const messages = await Message.find({ maison: { $in: maisonIds } })
      .populate('maison', 'titre')
      .sort({ createdAt: -1 });

    
    const result = messages.map(m => ({
  _id: m._id,
  maison: m.maison ? m.maison.titre : 'Maison supprimée',
  nomClient: m.nomClient,
  email: m.email,
  telephone: m.telephone || '',
  message: m.message,
  statut: m.statut, // 👈 ajouté
  from: m.from,
  date: m.createdAt
}));


    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Répondre à un message (propriétaire)
// --- Répondre à un message (propriétaire)
router.put('/:id/reponse', auth, async (req, res) => {
  try {
    const { reponse } = req.body;

    const msg = await Message.findById(req.params.id).populate('maison');
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });

    if (msg.maison.proprietaire.toString() !== req.proprietaire._id.toString())
      return res.status(403).json({ error: 'Non autorisé' });

    // Mettre à jour le message
    msg.reponseProprietaire = reponse;
    msg.statut = 'traite';
    await msg.save();

    res.json({ success: true, message: 'Réponse enregistrée et message marqué comme traité', data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

   // --- Supprimer un message (propriétaire)
router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id).populate('maison');
    if (!msg) return res.status(404).json({ success: false, error: 'Message introuvable' });

    // Vérifie que le message appartient à une maison du propriétaire
    if (msg.maison.proprietaire.toString() !== req.proprietaire._id.toString()) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    await msg.deleteOne();
    res.json({ success: true, message: 'Message supprimé avec succès !' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// --- Récupérer toutes les conversations d’un client
router.get('/client/:email', async (req, res) => {
  try {
    const messages = await Message.find({ email: req.params.email })
      .populate('maison', 'titre')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Envoyer un message (client ou propriétaire dans une conversation existante)
router.post('/envoyer', async (req, res) => {
  try {
    const { email, maisonId, message, from, nomClient } = req.body;
    if (!email || !maisonId || !message || !from)
      return res.status(400).json({ success: false, error: "Champs obligatoires manquants" });

    const msg = new Message({
      maison: maisonId,
      nomClient: nomClient || '', // nécessaire si from=client
      email,
      message,
      from
    });

    await msg.save();
    res.json({ success: true, message: "Message envoyé avec succès !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
