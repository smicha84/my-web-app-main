const { TwitterApi } = require('twitter-api-v2');

// Use the credentials directly to test authentication
const credentials = {
  appKey: '4AHX14L5ra7uW946hlVs2s5lG',
  appSecret: 'OR5NuxqF8zQIdLSDXSYuIOgfI4DAeOIwc3wbfU1QYnRttodjFJ',
  accessToken: '571158708-cIZWRVMYWIi579Pb1CLCxQeWIA4AJsYe9RCGr7Z1',
  accessSecret: 'zi9wgxCP8yK0rAPZqB382ZSi2BULtaqSefjlkZecbJGRT'
};

// Also try with bearer token
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAAJGx0AEAAAAAIZBUZE9YAk6PzQ%2BheEjO%2FNYZl8A%3DiFQ47DSTIFMa9CiNnJXUc3MmJM1IIMTrHFOw2eiQKswehXnGtt';

async function testUserAuthentication() {
  try {
    console.log('Testing OAuth 1.0a authentication...');
    const userClient = new TwitterApi(credentials);
    
    // First try with user auth credentials (OAuth 1.0a)
    console.log('Attempting to fetch user data to verify credentials...');
    const me = await userClient.v2.me();
    console.log('Successfully authenticated as user:', me.data);
    
    console.log('Attempting to fetch home timeline...');
    const homeTimeline = await userClient.v2.homeTimeline({
      max_results: 5,
      'tweet.fields': ['created_at', 'text']
    });
    
    if (homeTimeline.data && homeTimeline.data.data.length > 0) {
      console.log('Successfully fetched home timeline:');
      homeTimeline.data.data.forEach(tweet => {
        console.log(`- ${tweet.text} (${tweet.created_at})`);
      });
    } else {
      console.log('Home timeline is empty or not accessible');
    }
    
    return true;
  } catch (error) {
    console.error('OAuth 1.0a user authentication failed:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
    return false;
  }
}

async function testBearerAuthentication() {
  try {
    console.log('\nTesting OAuth 2.0 Bearer Token authentication...');
    const bearerClient = new TwitterApi(bearerToken);
    
    // Try to search for tweets (public data)
    console.log('Attempting to search for tweets...');
    const result = await bearerClient.v2.search('twitter', {
      max_results: 5,
      'tweet.fields': ['created_at']
    });
    
    if (result.data && result.data.length > 0) {
      console.log('Successfully searched for tweets:');
      result.data.forEach(tweet => {
        console.log(`- ${tweet.text}`);
      });
    } else {
      console.log('No search results found');
    }
    
    return true;
  } catch (error) {
    console.error('OAuth 2.0 Bearer Token authentication failed:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
    return false;
  }
}

// Run both authentication tests
async function runTests() {
  const userAuthSuccess = await testUserAuthentication();
  const bearerAuthSuccess = await testBearerAuthentication();
  
  if (userAuthSuccess) {
    console.log('\n✅ OAuth 1.0a User Authentication successful');
  } else {
    console.log('\n❌ OAuth 1.0a User Authentication failed');
  }
  
  if (bearerAuthSuccess) {
    console.log('✅ OAuth 2.0 Bearer Token Authentication successful');
  } else {
    console.log('❌ OAuth 2.0 Bearer Token Authentication failed');
  }
}

runTests().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
