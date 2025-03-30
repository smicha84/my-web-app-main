require('dotenv').config();
const { getLatestTweet } = require('./services/twitter');

// API Key and secrets should be defined in the .env file
console.log('Testing Twitter API connection...');
console.log('API Key present:', !!process.env.TWITTER_API_KEY);
console.log('API Secret present:', !!process.env.TWITTER_API_SECRET);
console.log('Access Token present:', !!process.env.TWITTER_ACCESS_TOKEN);
console.log('Access Secret present:', !!process.env.TWITTER_ACCESS_SECRET);
console.log('Bearer Token present:', !!process.env.TWITTER_BEARER_TOKEN);

// Test the getLatestTweet function
async function testTwitterAPI() {
  try {
    console.log('Attempting to fetch latest tweet from your home timeline...');
    const tweet = await getLatestTweet();
    console.log('Success! Got tweet:', tweet);
    return tweet;
  } catch (error) {
    console.error('Error testing Twitter API:', error);
    throw error;
  }
}

testTwitterAPI()
  .then(tweet => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
