require('dotenv').config();
const { getLatestTweet } = require('./services/twitter');
const { generateAppIdea } = require('./services/openai');

// Check for OpenAI API key
console.log('Testing OpenAI integration...');
console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is missing from your .env file');
  console.error('Please add your OpenAI API key to the .env file');
  process.exit(1);
}

// Test just the OpenAI part with a sample tweet
async function testCompleteFlow() {
  try {
    console.log('\nTesting OpenAI API integration directly with a sample tweet...');
    
    // Use a hardcoded tweet for direct OpenAI testing
    const sampleTweet = {
      id: '1234567890',
      text: 'I wish there was an app that could help developers integrate multiple APIs more easily. Authentication flows are so complex! #programming #webdev',
      created_at: new Date().toISOString()
    };
    
    console.log(`\nSample tweet: "${sampleTweet.text}"`);
    
    console.log('\n2. Generating app idea based on this tweet...');
    const appIdea = await generateAppIdea(sampleTweet);
    
    console.log('\nApp idea generated successfully:');
    console.log(JSON.stringify(appIdea, null, 2));
    
    return { tweet: sampleTweet, appIdea };
  } catch (error) {
    console.error('Error in OpenAI test:', error);
    throw error;
  }
}

testCompleteFlow()
  .then(result => {
    console.log('\n✅ Complete flow test successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Complete flow test failed');
    process.exit(1);
  });
