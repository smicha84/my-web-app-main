const express = require('express');
const db = require('../db');

const router = express.Router();

// GET all saved tweet-idea pairs
router.get('/', (req, res) => {
  db.all('SELECT * FROM tweet_idea_pairs ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error fetching tweet-idea pairs:', err);
      return res.status(500).json({ error: 'Failed to fetch tweet-idea pairs' });
    }
    
    // Parse the JSON string for app_idea_json before sending
    const parsedRows = rows.map(row => {
      try {
        return {
          ...row,
          app_idea_json: JSON.parse(row.app_idea_json)
        };
      } catch (parseError) {
        console.error(`Error parsing app_idea_json for ID ${row.id}:`, parseError);
        return {
          ...row,
          app_idea_json: { error: 'Failed to parse stored JSON' }
        };
      }
    });
    
    res.json(parsedRows);
  });
});

// GET a specific tweet-idea pair by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM tweet_idea_pairs WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error fetching tweet-idea pair:', err);
      return res.status(500).json({ error: 'Failed to fetch tweet-idea pair' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Tweet-idea pair not found' });
    }
    
    // Parse the JSON string
    try {
      res.json({
        ...row,
        app_idea_json: JSON.parse(row.app_idea_json)
      });
    } catch (parseError) {
      console.error(`Error parsing app_idea_json for ID ${row.id}:`, parseError);
      res.json({
        ...row,
        app_idea_json: { error: 'Failed to parse stored JSON' }
      });
    }
  });
});

module.exports = router;
