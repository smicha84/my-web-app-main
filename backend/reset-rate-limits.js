/**
 * This is a one-time script to reset the local rate limit tracking
 * when it gets stuck in a rate-limited state.
 */

// Import the correct path module
const path = require('path');

// Get a reference to the twitter service
const twitterService = require('./services/twitter');

// Directly reset the rate limit tracking by calling a function to do it
console.log('Attempting to reset rate limit tracking...');
const result = twitterService.forceResetRateLimits();

console.log('Rate limit tracking reset successfully!');
console.log('New rate limit status:', result);
console.log('\nYou can now restart your app and try again.');
