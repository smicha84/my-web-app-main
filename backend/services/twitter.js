const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

// Cache configuration
const CACHE_DIR = path.join(__dirname, '../cache');
const TWEET_CACHE_FILE = path.join(CACHE_DIR, 'tweet_cache.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours cache validity

// Request queue configuration for throttling
const REQUEST_QUEUE = [];
const MIN_REQUEST_INTERVAL_MS = 60000; // 1 minute between requests
let isProcessingQueue = false;
let lastRequestTime = 0;

// Local rate limit tracking system
// This tracks our usage locally without making API calls just to check limits
const RATE_LIMIT_TOTAL = 500; // Basic plan default

// FIXED: Track rate limit info in a more structured way
const rateLimit = {
  // When was the local tracking last reset
  lastReset: 0,
  // When the current window will reset (epoch seconds)
  resetTime: 0,
  // Requests remaining in current window
  remaining: RATE_LIMIT_TOTAL,
  // Timestamp when we last updated from actual Twitter headers
  lastHeaderUpdate: 0,
  // Whether we're currently rate limited according to our tracking
  isLimited: false
};

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  console.log(`Creating cache directory at ${CACHE_DIR}`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Read tweets from cache
 * @returns {Object} Object containing tweets array and timestamp
 */
const readTweetCache = () => {
  try {
    if (fs.existsSync(TWEET_CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(TWEET_CACHE_FILE, 'utf8'));
      console.log(`Read ${cacheData.tweets.length} tweets from cache, cache age: ${new Date() - new Date(cacheData.timestamp)} ms`);
      return cacheData;
    }
  } catch (error) {
    console.error('Error reading tweet cache:', error);
  }
  return { tweets: [], timestamp: null };
};

/**
 * Write tweets to cache
 * @param {Array} tweets - Array of tweet objects to cache
 */
const writeTweetCache = (tweets) => {
  try {
    const cacheData = {
      tweets,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(TWEET_CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log(`Cached ${tweets.length} tweets at ${cacheData.timestamp}`);
  } catch (error) {
    console.error('Error writing tweet cache:', error);
  }
};

/**
 * Initialize Twitter client with OAuth 1.0a User Context authentication
 * This allows access to the user's home timeline (tweets from people they follow)
 */
const initClient = () => {
  try {
    // These credentials are from the .env.example file - they're working OAuth 1.0a credentials
    const client = new TwitterApi({
      appKey: '4AHX14L5ra7uW946hlVs2s5lG',
      appSecret: 'OR5NuxqF8zQIdLSDXSYuIOgfI4DAeOIwc3wbfU1QYnRttodjFJ',
      accessToken: '571158708-cIZWRVMYWIi579Pb1CLCxQeWIA4AJsYe9RCGr7Z1',
      accessSecret: 'zi9wgxCP8yK0rAPZqB382ZSi2BULtaqSefjlkZecbJGRT'
    });
    
    console.log('Twitter client initialized successfully with OAuth 1.0a');
    return client;
  } catch (error) {
    console.error('Error initializing Twitter client:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    throw error;
  }
};

// Caching functions have been removed to ensure fresh data

/**
 * Get cached tweets from our local store
 * Returns an array of tweets plus rate limit information
 */
const getCachedTweets = async () => {
  // Check the current rate limit status
  const status = updateLocalRateLimitTracking();
  const now = Math.floor(Date.now() / 1000);
  
  try {
    // Read from cache
    const { tweets, timestamp } = readTweetCache();
    
    if (tweets && tweets.length > 0) {
      console.log(`[${new Date().toISOString()}] Returning ${tweets.length} cached tweets from ${timestamp}`);
      
      return {
        tweets,
        rateLimit: {
          limited: status.limited,
          resetTime: status.resetTime,
          remainingTime: status.remainingTime,
          remainingRequests: status.remainingRequests
        },
        source: 'cache',
        cacheTimestamp: timestamp
      };
    } else {
      console.log(`[${new Date().toISOString()}] No tweets found in cache`);
      return {
        tweets: [],
        rateLimit: {
          limited: status.limited,
          resetTime: status.resetTime,
          remainingTime: status.remainingTime,
          remainingRequests: status.remainingRequests
        },
        source: 'cache',
        cacheTimestamp: null
      };
    }
  } catch (error) {
    console.error(`Error retrieving cached tweets:`, error);
    throw error;
  }
};

/**
 * Get multiple tweets from the user's home timeline
 * Uses OAuth 1.0a User Context authentication
 * Handles rate limiting with caching and exponential backoff
 * Returns an array of tweets plus rate limit information
 */
/**
 * Get multiple tweets from the user's home timeline
 * Uses OAuth 1.0a User Context authentication
 * Handles rate limiting with caching and exponential backoff
 * Returns an array of tweets plus rate limit information
 */
const getMultipleTweets = async () => {
  // Check if we're currently rate limited using our local tracking
  const status = updateLocalRateLimitTracking();
  const now = Math.floor(Date.now() / 1000);
  
  // FIXED: If we're rate limited, try to use cache instead
  if (status.limited) {
    const resetDate = new Date(status.resetTime * 1000);
    console.log(`Rate limited according to local tracking. Will reset at ${resetDate.toLocaleTimeString()} (in ${status.remainingTime} seconds). Trying cache...`);
    
    // Try to get tweets from cache
    const { tweets, timestamp } = readTweetCache();
    
    if (tweets && tweets.length > 0) {
      console.log(`[${new Date().toISOString()}] Using ${tweets.length} cached tweets since we're rate limited`);
      return {
        tweets,
        rateLimit: {
          limited: status.limited,
          resetTime: status.resetTime,
          remainingTime: status.remainingTime,
          remainingRequests: status.remainingRequests
        },
        source: 'cache',
        cacheTimestamp: timestamp
      };
    }
    
    // If cache is empty, we have to inform about rate limiting
    throw new Error(`Twitter API rate limited and no tweets in cache. Please try again in ${status.remainingTime} seconds`);
  }
  
  try {
    console.log('Fetching latest tweets from home timeline...');
    // Initialize the Twitter client with OAuth 1.0a
    const client = initClient();
    
    try {
      // First, get the authenticated user's ID
      const currentUser = await client.v2.me();
      const userId = currentUser.data.id;
      console.log(`Authenticated as user ID: ${userId}`);
      
      // Use the reverse chronological home timeline endpoint with enhanced fields
      // For Basic plan, we request 10 tweets to stay within rate limits
      console.log(`[${new Date().toISOString()}] Requesting 10 tweets from homeTimeline endpoint`);
      const timelineResponse = await client.v2.homeTimeline({
        'tweet.fields': [
          'created_at', 
          'public_metrics', 
          'text', 
          'attachments', 
          'conversation_id', 
          'entities',
          'referenced_tweets'
        ],
        'user.fields': ['username', 'name', 'profile_image_url'],
        'media.fields': ['url', 'preview_image_url', 'type', 'height', 'width', 'alt_text'],
        expansions: [
          'author_id', 
          'attachments.media_keys', 
          'referenced_tweets.id', 
          'referenced_tweets.id.author_id',
          'entities.mentions.username'
        ],
        max_results: 10 // Get 10 tweets per request instead of just 1
      });
      
      // Get tweets from the timeline
      const tweets = timelineResponse.data?.data;
      
      // Process and return available tweets
      if (tweets && tweets.length > 0) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Successfully retrieved ${tweets.length} tweet(s) from home timeline`);
        
        // Process each tweet to add media
        const processedTweets = tweets.map(tweet => {
          console.log('Tweet details:', {
            id: tweet.id,
            author_id: tweet.author_id,
            created_at: tweet.created_at,
            hasAttachments: !!tweet.attachments
          });
          
          // Clone the tweet to avoid modifying the original
          const processedTweet = {...tweet};
          
          // Add user info to the tweet
          if (tweet.author_id && timelineResponse.includes?.users) {
            const author = timelineResponse.includes.users.find(user => user.id === tweet.author_id);
            if (author) {
              processedTweet.author = {
                id: author.id,
                username: author.username,
                name: author.name,
                profile_image_url: author.profile_image_url
              };
            }
          }
          
          // Add media to the tweet object if it exists
          if (tweet.attachments && tweet.attachments.media_keys && timelineResponse.includes?.media) {
            processedTweet.media = tweet.attachments.media_keys.map(key => {
              return timelineResponse.includes.media.find(media => media.media_key === key);
            }).filter(Boolean);
          }
          
          // Add referenced tweets (for threads)
          if (tweet.referenced_tweets && timelineResponse.includes?.tweets) {
            processedTweet.referenced_tweets = tweet.referenced_tweets.map(ref => {
              const referencedTweet = timelineResponse.includes.tweets.find(t => t.id === ref.id);
              if (!referencedTweet) return null;
              
              // Add author info to referenced tweet
              const refTweetWithAuthor = { ...referencedTweet, reference_type: ref.type };
              if (referencedTweet.author_id && timelineResponse.includes?.users) {
                const author = timelineResponse.includes.users.find(user => user.id === referencedTweet.author_id);
                if (author) {
                  refTweetWithAuthor.author = {
                    id: author.id,
                    username: author.username,
                    name: author.name
                  };
                }
              }
              
              return refTweetWithAuthor;
            }).filter(Boolean);
          }
          
          return processedTweet;
        });
        
        // Cache tweets for future use
        writeTweetCache(processedTweets);
        
        // Extract rate limit information from response headers
        // Update our local tracking with the Twitter-provided data
        const rateHeaders = timelineResponse._headers;
        updateRateLimitsFromHeaders(rateHeaders);
        const now = Math.floor(Date.now() / 1000);
        
        // Decrement our local counter since we just successfully made a request
        rateLimit.remaining = Math.max(0, rateLimit.remaining - 1);
        
        // No longer need to check old rateLimitReset variable
        // Instead use our rateLimit object
        
        // Get the current status from our local tracking
        const status = updateLocalRateLimitTracking();
        const serverNow = new Date();
                
        // Log rate limit information
        console.log(`[${serverNow.toISOString()}] Local rate limit status: ${status.remainingRequests} requests remaining`);
        console.log(`[${serverNow.toISOString()}] Local rate limit reset time: ${new Date(status.resetTime * 1000).toLocaleTimeString()}`);
        console.log(`[${serverNow.toISOString()}] Local rate limit resets in ${status.remainingTime} seconds`);
        
        // Use our local tracking information
        const rateLimitInfo = {
          limited: status.limited,
          resetTime: status.resetTime,
          remainingTime: status.remainingTime,
          remainingRequests: status.remainingRequests
        };
        
        return {
          tweets: processedTweets,
          rateLimit: rateLimitInfo
        };
      } else {
        console.log(`[${new Date().toISOString()}] No tweets found in home timeline, returning empty array`);
        
        // Extract rate limit information from response headers even if no tweets found
        const rateHeaders = timelineResponse._headers;
        updateRateLimitsFromHeaders(rateHeaders);
        
        // Still decrement our local counter since we made a successful request
        rateLimit.remaining = Math.max(0, rateLimit.remaining - 1);
        
        // Get current status
        const status = updateLocalRateLimitTracking();
        
        return {
          tweets: [], // Return empty array instead of throwing error
          rateLimit: {
            limited: status.limited,
            resetTime: status.resetTime,
            remainingTime: status.remainingTime,
            remainingRequests: status.remainingRequests
          }
        };
      }
    } catch (error) {
      // Handle rate limit errors
      if (error.code === 429) {
        const resetTime = error.rateLimit?.reset;
        
        if (resetTime) {
          // Update our local tracking based on the Twitter error
          rateLimit.resetTime = resetTime;
          rateLimit.remaining = 0;
          rateLimit.isLimited = true;
          rateLimit.lastHeaderUpdate = now;
          
          console.log(`Rate limited by Twitter API. Will reset at ${new Date(resetTime * 1000).toISOString()}`);
        } else {
          // If Twitter doesn't provide a reset time, use our local tracking
          // But first make sure our local tracking is up-to-date
          updateLocalRateLimitTracking();
          rateLimit.remaining = 0;
          rateLimit.isLimited = true;
        }
        
        // Get updated status after adjusting our local tracking
        const status = updateLocalRateLimitTracking();
        
        // Report the rate limit error
        const limitError = new Error(`Twitter API rate limited. Please try again in ${status.remainingTime} seconds`);
        limitError.isRateLimit = true;
        limitError.rateLimit = {
          limited: true,
          resetTime: status.resetTime,
          remainingTime: status.remainingTime,
          remainingRequests: 0
        };
        throw limitError;
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (error.code !== 429) {
      console.error('Error fetching home timeline:', error);
    }
    
    // No caching - propagate all errors to the client
    throw error;
  }
};



/**
 * Search for tweets with a specific query
 */
const searchTweets = async (query) => {
  try {
    const client = initClient();
    
    const result = await client.v2.search(query, {
      'tweet.fields': ['created_at', 'public_metrics', 'text'],
      'user.fields': ['username', 'name'],
      expansions: ['author_id'],
      max_results: 10
    });
    
    return result.data;
  } catch (error) {
    console.error('Error searching tweets:', error);
    throw error; // Propagate the error instead of returning empty data
  }
};

// Legacy function for backward compatibility
const getLatestTweet = async () => {
  const result = await getMultipleTweets();
  return Array.isArray(result.tweets) ? result.tweets[0] : result.tweets;
};

/**
 * Calculate the next 15-minute interval reset time
 * Twitter uses fixed 15-minute windows (00, 15, 30, 45)
 */
const calculateNextResetTime = () => {
  const now = new Date();
  // Get current minutes and calculate how many minutes until the next 15-minute mark
  const currentMinutes = now.getMinutes();
  const minutesToNextInterval = 15 - (currentMinutes % 15);
  
  // Create a date for the next reset time
  const resetDate = new Date(now);
  resetDate.setMinutes(now.getMinutes() + minutesToNextInterval);
  resetDate.setSeconds(0);
  resetDate.setMilliseconds(0);
  
  return Math.floor(resetDate.getTime() / 1000);
};

/**
 * Update local rate limit tracking based on the current time
 * This handles resetting our counters when a 15-minute window ends
 */
const updateLocalRateLimitTracking = () => {
  const now = Math.floor(Date.now() / 1000);
  
  // Check if we're past the reset time and need to refresh our counters
  if (now >= rateLimit.resetTime) {
    // Calculate the next reset time based on 15-minute intervals
    rateLimit.resetTime = calculateNextResetTime();
    rateLimit.remaining = RATE_LIMIT_TOTAL;
    rateLimit.isLimited = false;
    rateLimit.lastReset = now;
    
    console.log(`[${new Date().toISOString()}] Rate limit window reset. Next reset at: ${new Date(rateLimit.resetTime * 1000).toISOString()}`);
  }
  
  return {
    limited: rateLimit.isLimited,
    resetTime: rateLimit.resetTime,
    remainingTime: rateLimit.resetTime - now,
    remainingRequests: rateLimit.remaining,
    nextResetAt: new Date(rateLimit.resetTime * 1000).toLocaleTimeString()
  };
};

/**
 * Update rate limit tracking from Twitter API headers
 * Only call this when we actually get headers from Twitter
 */
const updateRateLimitsFromHeaders = (headers) => {
  if (!headers) return;
  
  const now = Math.floor(Date.now() / 1000);
  
  // Extract rate limit information from the headers
  const remaining = parseInt(headers.get('x-rate-limit-remaining') || rateLimit.remaining.toString());
  const resetTime = parseInt(headers.get('x-rate-limit-reset') || '0');
  
  if (resetTime > 0) {
    // Only update if we got valid data from Twitter
    rateLimit.resetTime = resetTime;
    rateLimit.remaining = remaining;
    rateLimit.isLimited = remaining <= 0;
    rateLimit.lastHeaderUpdate = now;
    
    // Log the update from Twitter headers
    console.log(`[${new Date().toISOString()}] Rate limits updated from Twitter headers: ${remaining} requests remaining until ${new Date(resetTime * 1000).toLocaleTimeString()}`);
  }
};

/**
 * Get current rate limit status WITHOUT making an API call
 * Uses our local tracking system
 */
const getRateLimitStatus = () => {
  // Update our local tracking based on current time
  return updateLocalRateLimitTracking();
};

/**
 * Force reset the rate limit tracking
 * This is useful when the rate limit tracking gets stuck
 */
/**
 * Force reset the rate limit tracking
 * This is useful when the rate limit tracking gets stuck
 */
const forceResetRateLimits = () => {
  const now = Math.floor(Date.now() / 1000);
  
  // Reset to full capacity
  rateLimit.resetTime = now; // Set to now so updateLocalRateLimitTracking will reset it
  rateLimit.remaining = 0;   // Set to 0 temporarily
  rateLimit.isLimited = false;
  rateLimit.lastReset = 0;
  rateLimit.lastHeaderUpdate = 0;
  
  // Call update to recalculate everything
  const status = updateLocalRateLimitTracking();
  
  console.log(`[${new Date().toISOString()}] Rate limit tracking FORCE RESET. Next reset at: ${new Date(rateLimit.resetTime * 1000).toISOString()}`);
  console.log(`[${new Date().toISOString()}] New remaining requests: ${rateLimit.remaining}`);
  
  return status;
};

module.exports = { 
  getLatestTweet, 
  getMultipleTweets, 
  getCachedTweets,
  searchTweets, 
  getRateLimitStatus, 
  forceResetRateLimits 
};

