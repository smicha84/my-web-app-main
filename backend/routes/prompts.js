const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all prompts
router.get('/', (req, res) => {
  db.all('SELECT id, name, content, is_default, created_at FROM prompts ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching prompts:', err);
      return res.status(500).json({ error: 'Failed to fetch prompts' });
    }
    res.json(rows);
  });
});

// Get default prompt
router.get('/default', (req, res) => {
  db.get('SELECT id, name, content, is_default, created_at FROM prompts WHERE is_default = 1', (err, row) => {
    if (err) {
      console.error('Error fetching default prompt:', err);
      return res.status(500).json({ error: 'Failed to fetch default prompt' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Default prompt not found' });
    }
    
    res.json(row);
  });
});

// Get specific prompt by ID
router.get('/:id', (req, res) => {
  const promptId = req.params.id;
  
  db.get('SELECT id, name, content, is_default, created_at FROM prompts WHERE id = ?', [promptId], (err, row) => {
    if (err) {
      console.error('Error fetching prompt:', err);
      return res.status(500).json({ error: 'Failed to fetch prompt' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(row);
  });
});

// Create a new prompt
router.post('/', (req, res) => {
  const { name, content, is_default } = req.body;
  
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }
  
  const isDefault = is_default ? 1 : 0;
  
  // If this is set as the default prompt, unset any existing default
  const updatePrompts = (callback) => {
    if (isDefault) {
      db.run('UPDATE prompts SET is_default = 0 WHERE is_default = 1', (err) => {
        if (err) {
          console.error('Error updating existing default prompts:', err);
          return callback(err);
        }
        callback(null);
      });
    } else {
      callback(null);
    }
  };
  
  updatePrompts((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update existing default prompt' });
    }
    
    db.run(
      'INSERT INTO prompts (name, content, is_default) VALUES (?, ?, ?)',
      [name, content, isDefault],
      function(err) {
        if (err) {
          console.error('Error creating prompt:', err);
          return res.status(500).json({ error: 'Failed to create prompt' });
        }
        
        const id = this.lastID;
        res.status(201).json({
          id,
          name,
          content,
          is_default: isDefault,
          created_at: new Date().toISOString()
        });
      }
    );
  });
});

// Update an existing prompt
router.put('/:id', (req, res) => {
  const promptId = req.params.id;
  const { name, content, is_default } = req.body;
  
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }
  
  const isDefault = is_default ? 1 : 0;
  
  // If this is set as the default prompt, unset any existing default
  const updatePrompts = (callback) => {
    if (isDefault) {
      db.run('UPDATE prompts SET is_default = 0 WHERE is_default = 1', (err) => {
        if (err) {
          console.error('Error updating existing default prompts:', err);
          return callback(err);
        }
        callback(null);
      });
    } else {
      callback(null);
    }
  };
  
  updatePrompts((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update existing default prompt' });
    }
    
    db.run(
      'UPDATE prompts SET name = ?, content = ?, is_default = ? WHERE id = ?',
      [name, content, isDefault, promptId],
      function(err) {
        if (err) {
          console.error('Error updating prompt:', err);
          return res.status(500).json({ error: 'Failed to update prompt' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Prompt not found' });
        }
        
        res.json({
          id: promptId,
          name,
          content,
          is_default: isDefault
        });
      }
    );
  });
});

// Delete a prompt
router.delete('/:id', (req, res) => {
  const promptId = req.params.id;
  
  // Check if this is the default prompt
  db.get('SELECT is_default FROM prompts WHERE id = ?', [promptId], (err, row) => {
    if (err) {
      console.error('Error checking prompt:', err);
      return res.status(500).json({ error: 'Failed to check prompt' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // Don't allow deleting the default prompt
    if (row.is_default) {
      return res.status(400).json({ error: 'Cannot delete the default prompt' });
    }
    
    db.run('DELETE FROM prompts WHERE id = ?', [promptId], function(err) {
      if (err) {
        console.error('Error deleting prompt:', err);
        return res.status(500).json({ error: 'Failed to delete prompt' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      res.json({ message: 'Prompt deleted successfully' });
    });
  });
});

module.exports = router;
