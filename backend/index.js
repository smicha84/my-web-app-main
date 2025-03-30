const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
require('dotenv').config();

// Service imports
const { getLatestTweet } = require('./services/twitter');
const { generateAppIdea } = require('./services/openai');

// Route imports
const twitterRoutes = require('./routes/twitter');
const ideasRoutes = require('./routes/ideas');
const promptsRoutes = require('./routes/prompts');
const testOpenaiRoutes = require('./routes/testOpenai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Healthy' });
});

// API routes
app.use('/api/twitter', twitterRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/test/openai', testOpenaiRoutes);

// Database is already initialized in the ideas routes module

// Automated polling has been removed to avoid background API calls that could interfere with testing

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Automated polling has been disabled to allow manual testing
  console.log('Note: Automated tweet polling has been disabled for easier testing');
});
