const express = require('express');
const { getLatestTweet } = require('../services/twitter');
const { generateAppIdea } = require('../services/openai');
const db = require('../db');
const router = express.Router();

// Generate an app idea from the latest tweet in your home timeline
// Debug route to see raw response
router.post('/debug', async (req, res) => {
  try {
    const { tweet } = req.body;
    if (!tweet || !tweet.text) {
      return res.status(400).json({error: 'No tweet provided'});
    }
    const result = await generateAppIdea(tweet);
    res.json({
      raw_response: result.app_idea,
      full_data: result
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

router.post('/generate', async (req, res) => {
  try {
    // Get tweet and promptId from request body
    const { tweet: requestTweet, promptId } = req.body;
    
    console.log('REQUEST BODY RECEIVED:', JSON.stringify(req.body, null, 2));
    
    // CRITICAL FIX: Use the tweet sent from the frontend instead of fetching a new one
    let tweet;
    
    if (requestTweet && requestTweet.text) {
      // Use the tweet from the request body
      console.log('Using tweet from request body:', requestTweet.text);
      tweet = requestTweet;
    } else {
      // Fallback to fetching latest tweet only if none was provided
      console.log('No tweet in request, fetching latest tweet from Twitter...');
      tweet = await getLatestTweet();
      
      if (!tweet || !tweet.text) {
        return res.status(400).json({ 
          success: false, 
          error: 'Could not retrieve a valid tweet' 
        });
      }
    }
    
    console.log('Tweet being used for generation:', tweet.text);
    
    // Generate an app idea based on the tweet and optional promptId
    console.log(`Generating app idea${promptId ? ` using prompt ID ${promptId}` : ' using default prompt'}...`);
    console.log('Using tweet:', JSON.stringify(tweet, null, 2));
    
    const appIdea = await generateAppIdea(tweet, promptId);
    console.log('CRITICAL DEBUG - Raw appIdea data received from OpenAI:', JSON.stringify(appIdea, null, 2));
    
    // Convert app idea to JSON string for storage
    const appIdeaJSON = JSON.stringify(appIdea);
    
    // Save to database with full tweet object
    const fullTweetJSON = JSON.stringify(tweet);
    db.run(
      'INSERT INTO ideas (tweet_text, tweet_created_at, app_idea, full_tweet) VALUES (?, ?, ?, ?)',
      [tweet.text, tweet.created_at, appIdeaJSON, fullTweetJSON],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to save app idea to database',
            details: err.message 
          });
        }
        
        // DEFINITIVE FIX: Ensure identical behavior between routes
        console.log('FINAL APP IDEA STRUCTURE BEING RETURNED:', JSON.stringify(appIdea, null, 2));
        
        // Extract app_idea string from returned object to ensure consistent format
        // The OpenAI service now returns an object with app_idea as a property
        const finalData = {
          id: this.lastID,
          tweet_text: tweet.text,
          app_idea: appIdea.app_idea, // Extract string from the object property
          created_at: new Date().toISOString()
        };
        
        console.log('SENDING TO FRONTEND:', JSON.stringify(finalData, null, 2));
        
        res.json({
          success: true,
          data: finalData
        });
      }
    );
  } catch (error) {
    console.error('Error in /generate route:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate app idea',
      details: error.message 
    });
  }
});

// Get all stored app ideas
router.get('/', (req, res) => {
  db.all('SELECT * FROM ideas ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve app ideas',
        details: err.message 
      });
    }
    
    // Process the JSON strings and fix the app_idea structure
    const processedRows = rows.map(row => {
      try {
        // Extract app_idea and ensure it's formatted correctly for the frontend
        if (row.app_idea) {
          // Parse the JSON string from the database
          const parsedIdea = JSON.parse(row.app_idea);
          
          // CRITICAL FIX: Extract the app_idea string directly
          // This ensures we're not double-wrapping the JSON
          if (typeof parsedIdea === 'object' && parsedIdea.app_idea) {
            row.app_idea = parsedIdea.app_idea;
          } else {
            // Fallback if format is unexpected
            console.warn('Unexpected app_idea format for ID:', row.id);
            row.app_idea = JSON.stringify(parsedIdea);
          }
        }
        
        // Process full_tweet if it exists
        if (row.full_tweet) {
          row.full_tweet = JSON.parse(row.full_tweet);
        }
        
        return row;
      } catch (e) {
        console.error('Error parsing JSON data for row ID:', row.id, e);
        return row; // Return original row if parsing fails
      }
    });
    
    console.log('Processed app ideas for frontend:', JSON.stringify(processedRows[0]?.app_idea, null, 2));
    
    res.json({ success: true, data: processedRows });
  });
});

// Get a specific app idea by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM ideas WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve app idea',
        details: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false, 
        error: 'App idea not found' 
      });
    }
    
    try {
      // Extract app_idea and ensure it's formatted correctly for the frontend
      if (row.app_idea) {
        // Parse the JSON string from the database
        const parsedIdea = JSON.parse(row.app_idea);
        
        // CRITICAL FIX: Extract the app_idea string directly
        // This ensures we're not double-wrapping the JSON
        if (typeof parsedIdea === 'object' && parsedIdea.app_idea) {
          row.app_idea = parsedIdea.app_idea;
          console.log('App idea unwrapped for ID:', id);
        } else {
          // Fallback if format is unexpected
          console.warn('Unexpected app_idea format for ID:', id);
          row.app_idea = JSON.stringify(parsedIdea);
        }
      }
      
      // Process full_tweet if it exists
      if (row.full_tweet) {
        row.full_tweet = JSON.parse(row.full_tweet);
      }
      
      console.log('Processed app idea for frontend:', typeof row.app_idea, row.app_idea.substring(0, 100) + '...');
    } catch (e) {
      console.error('Error parsing JSON data for idea ID:', id, e);
      // Continue with the original row data if parsing fails
    }
    
    res.json({ success: true, data: row });
  });
});

module.exports = router;
