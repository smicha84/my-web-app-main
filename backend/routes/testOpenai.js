const express = require('express');
const { generateAppIdea } = require('../services/openai');
const router = express.Router();

// Test endpoint that uses a sample tweet to test OpenAI integration
router.post('/test', async (req, res) => {
  try {
    console.log('===== TEST ENDPOINT CALLED =====');
    console.log('REQUEST BODY:', req.body);
    
    // Use provided tweet text or default to a sample
    const tweetText = req.body.tweetText || 
      'I wish there was an app that could help developers integrate multiple APIs more easily. Authentication flows are so complex! #programming #webdev';
    
    console.log('TWEET TEXT BEING USED:', tweetText);
    
    // Create a sample tweet object
    const sampleTweet = {
      id: 'test-' + Date.now(),
      text: tweetText,
      created_at: new Date().toISOString()
    };
    
    console.log('SAMPLE TWEET OBJECT:', JSON.stringify(sampleTweet, null, 2));
    
    try {
      console.log('CALLING OPENAI SERVICE...');
      // Generate app idea directly using this tweet
      const appIdea = await generateAppIdea(sampleTweet);
      
      console.log('OPENAI RETURNED THIS OBJECT:', JSON.stringify(appIdea, null, 2));
      
      if (!appIdea || !appIdea.app_idea) {
        console.error('CRITICAL ERROR: OpenAI response does not contain app_idea property');
        console.log('FULL RESPONSE:', appIdea);
        throw new Error('Invalid OpenAI response structure');
      }
      
      // Explicitly check the type of app_idea
      console.log('APP_IDEA TYPE:', typeof appIdea.app_idea);
      console.log('APP_IDEA VALUE (first 100 chars):', appIdea.app_idea.substring(0, 100) + '...');
      
      // Create the response structure
      const responseData = {
        id: 'test-' + Date.now(),
        tweet_text: sampleTweet.text,
        app_idea: appIdea.app_idea, // Extract the app_idea string from the returned object
        created_at: new Date().toISOString()
      };
      
      console.log('SENDING TO FRONTEND:', JSON.stringify(responseData, null, 2));
      
      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('OpenAI API Error Details:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error in OpenAI test endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test OpenAI integration',
      details: error.message 
    });
  }
});

module.exports = router;
