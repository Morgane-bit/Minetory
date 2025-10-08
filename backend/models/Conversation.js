const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  maisonId: { type: mongoose.Schema.Types.ObjectId, ref: "Maison", required: true },
  clientEmail: { type: String, required: true },
  messages: [
    {
      expediteur: { type: String, enum: ["client", "proprietaire"], required: true },
      texte: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Conversation", conversationSchema);
