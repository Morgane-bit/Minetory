const mongoose = require('mongoose');

const MaisonSchema = new mongoose.Schema({
  titre: { type: String, required: true, trim: true },
  localisation: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['studio', 'appartement', 'villa', 'duplex', 'chambre'] 
  },
  prix: { type: Number, required: true, min: 0 },
  description: { type: String, default: '', trim: true },
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'Proprietaire', required: true },
  images: { type: [String], default: [] } // URLs des images
}, { timestamps: true }); // createdAt et updatedAt

module.exports = mongoose.model('Maison', MaisonSchema);
