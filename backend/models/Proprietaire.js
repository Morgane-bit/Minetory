const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ProprietaireSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
ProprietaireSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch(err) {
    next(err);
  }
});

// Méthode pour comparer mot de passe
ProprietaireSchema.methods.comparePassword = async function(password){
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Proprietaire', ProprietaireSchema);
