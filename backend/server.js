// server.js
const express = require("express"); 
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const proprietaireRoutes = require('./routes/proprietaire');
const maisonRoutes = require('./routes/maisons');
const messageRoutes = require('./routes/messages');
const statRoutes = require('./routes/stats');

// Routes API
app.use('/api/proprietaire', proprietaireRoutes);
app.use('/api/maisons', maisonRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statRoutes);

// Route test API
app.get("/", (req, res) => {
  res.send("API Location Maisons fonctionne 🚀");
});

// Middleware 404 (route non trouvée)
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// Middleware global gestion erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur" });
});

// Connexion MongoDB et lancement serveur
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connecté');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  })
  .catch(err => console.log('❌ Erreur MongoDB :', err));
