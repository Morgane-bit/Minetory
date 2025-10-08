// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  maison: { type: mongoose.Schema.Types.ObjectId, ref: 'Maison', required: true },
  nomClient: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  telephone: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  reponseProprietaire: { type: String, default: '' }, // réponse du propriétaire
  statut: { type: String, enum: ['en_attente', 'traite'], default: 'en_attente' } ,// suivi du message
  from: { type: String, enum: ['client', 'proprietaire'], default: 'client' }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
