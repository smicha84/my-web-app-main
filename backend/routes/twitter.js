const express = require('express');
const { getLatestTweet, getMultipleTweets, getCachedTweets, getRateLimitStatus, forceResetRateLimits } = require('../services/twitter');
const router = express.Router();

// Get latest tweet from home feed (legacy endpoint)
router.get('/latest', async (req, res) => {
  try {
    console.log('Attempting to fetch latest tweet...');
    const tweet = await getLatestTweet();
    console.log('Successfully fetched tweet:', tweet.id);
    res.json({ success: true, data: tweet });
  } catch (error) {
    console.error('Error in /latest route:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      rateLimit: error.rateLimit || 'No rate limit info',
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve latest tweet',
      details: error.message 
    });
  }
});

// Get cached tweets without hitting the Twitter API
router.get('/cached-tweets', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Twitter Route: Fetching tweets from cache...`);
    const result = await getCachedTweets();
    
    // Return the cached tweets with source information
    res.json({
      success: true,
      data: {
        tweets: result.tweets,
        rateLimit: result.rateLimit,
        source: result.source,
        cacheTimestamp: result.cacheTimestamp
      }
    });
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(`[${errorTimestamp}] Twitter Route: Error fetching cached tweets:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cached tweets',
      details: error.message
    });
  }
});

// Get multiple tweets with rate limit info
router.get('/tweets', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Twitter Route: Attempting to fetch multiple tweets...`);
    const result = await getMultipleTweets();
    
    // If we have tweets in the result
    if (result && result.tweets) {
      const successTimestamp = new Date().toISOString();
      console.log(`[${successTimestamp}] Twitter Route: Successfully fetched ${result.tweets.length} tweets`);
      console.log(`Twitter Route: Tweet details: First tweet ID: ${result.tweets[0]?.id || 'none'}, ` +
                 `Rate limit remaining: ${result.rateLimit.remainingRequests}, ` +
                 `Rate limit reset: ${new Date(result.rateLimit.resetTime * 1000).toLocaleString()}`);
      
      // Log tweet text for the first tweet (for debugging)
      if (result.tweets.length > 0) {
        console.log(`Twitter Route: First tweet text: "${result.tweets[0].text.substring(0, 50)}..."`);
      }
      
      res.json({ 
        success: true, 
        data: {
          tweets: result.tweets,
          rateLimit: result.rateLimit
        }
      });
    } else {
      // This shouldn't happen with proper error handling
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] Twitter Route: No tweets in result but no error thrown`);
      res.status(500).json({ 
        success: false, 
        error: 'No tweets found',
        details: 'The Twitter API returned no tweets'
      });
    }
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(`[${errorTimestamp}] Twitter Route: Error in /tweets route:`, error.message);
    console.error('Twitter Route: Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      rateLimit: error.rateLimit || 'No rate limit info'
    });
    
    // Handle rate limit errors specifically
    if (error.message && error.message.includes('rate limit')) {
      const resetTime = error.rateLimit?.reset || (Math.floor(Date.now() / 1000) + 900);
      const resetDate = new Date(resetTime * 1000);
      console.error(`Twitter Route: Rate limited until ${resetDate.toLocaleString()}`);
      
      res.status(429).json({
        success: false,
        error: 'Twitter API rate limit exceeded',
        details: error.message,
        rateLimit: {
          limited: true,
          resetTime: resetTime,
          remainingTime: resetTime ? (resetTime - Math.floor(Date.now() / 1000)) : 900,
          remainingRequests: 0
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve tweets',
        details: error.message 
      });
    }
  }
});

// Get current rate limit status without fetching tweets
router.get('/rate-limit', async (req, res) => {
  try {
    console.log('Twitter Route: Getting rate limit status');
    const rateLimitStatus = await getRateLimitStatus();
    console.log('Twitter Route: Rate limit status:', rateLimitStatus);
    res.json({ 
      success: true, 
      data: rateLimitStatus 
    });
  } catch (error) {
    console.error('Twitter Route: Error getting rate limit status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get rate limit status', 
      details: error.message 
    });
  }
});

// FORCE RESET endpoint - use this to reset rate limiting when stuck
router.post('/force-reset', async (req, res) => {
  try {
    console.log('FORCE RESETTING RATE LIMITS - This should fix rate limit errors');
    const result = await forceResetRateLimits();
    console.log('Rate limits have been reset:', result);
    res.json({
      success: true,
      message: 'Rate limits forcibly reset',
      data: result
    });
  } catch (error) {
    console.error('Error forcing rate limit reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset rate limits',
      details: error.message
    });
  }
});

module.exports = router;
