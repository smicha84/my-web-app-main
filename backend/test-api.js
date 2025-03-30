/**
 * API Integration Test Script
 * Tests the Twitter and OpenAI integration in our backend
 */
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testTwitterEndpoint() {
  console.log('Testing Twitter API endpoint...');
  try {
    const response = await axios.get(`${API_URL}/twitter/latest`);
    console.log('Successfully fetched latest tweet:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing Twitter endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testGenerateIdeaEndpoint() {
  console.log('\nTesting generate app idea endpoint...');
  try {
    const response = await axios.post(`${API_URL}/ideas/generate`);
    console.log('Successfully generated app idea:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing generate idea endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testGetAllIdeasEndpoint() {
  console.log('\nTesting get all ideas endpoint...');
  try {
    const response = await axios.get(`${API_URL}/ideas`);
    console.log('Successfully retrieved all ideas:');
    console.log(`Total ideas: ${response.data.data.length}`);
    console.log('First idea:', JSON.stringify(response.data.data[0], null, 2));
    return response.data;
  } catch (error) {
    console.error('Error testing get all ideas endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function runTests() {
  try {
    // Test getting the latest tweet
    await testTwitterEndpoint();
    
    // Test generating an idea
    await testGenerateIdeaEndpoint();
    
    // Test retrieving all ideas
    await testGetAllIdeasEndpoint();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

// Run all tests
runTests();
